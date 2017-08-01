import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";
import { Chance } from "chance";
import { Client, Producer } from "kafka-node";
import { config } from "dotenv";
import { kafkaProducer$ } from "./KafkaProducer";

import { TransactionSystem } from "./TransactionSystem";

config();
const SERVER_ADDRESS = process.env.kafkaServerAddress || "localhost:2181";
const DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";

const kafkaClient = new Client(SERVER_ADDRESS)
const kafkaProducer = new Producer(kafkaClient);

const transactionSystem = new TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1501372800 * 1000),
    totalCustomer: 10000,
    totalProducts: 202852
}, createConnection(DB_ADDRESS));

const kafkaTopicName = process.env.kafkaTopicName || "TutorialTopic";

transactionSystem.orderReceived$()
    .mergeMap((transaction: Transaction) => {
        return kafkaProducer$(kafkaProducer, transaction, kafkaTopicName).mapTo(transaction)
    })
    .mergeMap(
    (transaction: Transaction) => transactionSystem.orderProcessed$(transaction)
        .mergeMap(transaction => kafkaProducer$(kafkaProducer, transaction, kafkaTopicName).mapTo(transaction))
    )
    .mergeMap(
    (transaction: Transaction) => (Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
        .map(transaction => {
            kafkaProducer.send(
                [{ messages: JSON.stringify(transaction), topic: kafkaTopicName }],
                (err, data) => {
                    console.log(data)
                }
            )
            return transaction
        })
        .catch(transaction => {
            kafkaProducer.send(
                [{ messages: JSON.stringify(transaction), topic: kafkaTopicName }],
                (err, data) => {
                    console.log(data)
                }
            )
            return Observable.empty()
        })
    )
    .mergeMap(
    (transaction: Transaction) => (Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
        .map(transaction => {
            kafkaProducer.send(
                [{ messages: JSON.stringify(transaction), topic: kafkaTopicName }],
                (err, data) => {
                    console.log(data)
                }
            )
            return transaction
        })
        .catch(transaction => {
            kafkaProducer.send(
                [{ messages: JSON.stringify(transaction), topic: kafkaTopicName }],
                (err, data) => {
                    console.log(data)
                }
            )
            return Observable.empty()
        })
    )
    .repeatWhen(() => transactionSystem.currentSysTime.getTime() < Date.now() ? Observable.interval(500) : Observable.interval(5000))
    .takeWhile(() => transactionSystem.lastOrderNumber < (process.env.numberOfTransaction || Infinity))
    .filter((transaction: Transaction) => transaction.order.amount !== 0)
    .subscribe(
    (transaction: Transaction) => console.info(transaction.order.orderId, "FIN"),
    err => console.error(err),
    () => console.info("Complete")
    );