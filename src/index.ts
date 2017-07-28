import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";
import { Chance } from "chance";
import { Client, Producer } from "kafka-node";

import { TransactionSystem } from "./TransactionSystem";

const SERVER_ADDRESS = "localhost:2181";

const kafkaClient = new Client(SERVER_ADDRESS)
const kafkaProducer = new Producer(kafkaClient);

const transactionSystem = new TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278 * 1000),
    totalCustomer: 10000,
    totalProducts: 202852
}, createConnection("mysql://root@localhost/ecomm"));

const kafkaTopicName = "TutorialTopic";

transactionSystem.orderReceived$()
    .mergeMap(
        (transaction: Transaction) => transactionSystem.orderProcessed$(transaction)
            .map(trasaction => {
                kafkaProducer.send(
                    [{messages: JSON.stringify(transaction), topic: kafkaTopicName}],
                    (err,data) => {
                        console.log(data)
                    }
                )
                return transaction
            })
    )
    .mergeMap(
        (transaction: Transaction) => (Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
            .map(transaction => {
                kafkaProducer.send(
                    [{messages: JSON.stringify(transaction), topic: kafkaTopicName}],
                    (err,data) => {
                        console.log(data)
                    }
                )
                return transaction
            })
            .catch(transaction => {
                kafkaProducer.send(
                    [{messages: JSON.stringify(transaction), topic: kafkaTopicName}],
                    (err,data) => {
                        console.log(data)
                    }
                )
                return Observable.empty()
            })
    )
    .mergeMap(
        (transaction: Transaction)  => (Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
            .map(transaction => {
                kafkaProducer.send(
                    [{messages: JSON.stringify(transaction), topic: kafkaTopicName}],
                    (err,data) => {
                        console.log(data)
                    }
                )
                return transaction
            })
            .catch(transaction => {
                kafkaProducer.send(
                    [{messages: JSON.stringify(transaction), topic: kafkaTopicName}],
                    (err,data) => {
                        console.log(data)
                    }
                )
                return Observable.empty()
            })
    )
    .repeatWhen(() => Observable.interval(500))
    // .takeWhile(() => transactionSystem.lastOrderNumber < 5)
    .subscribe(
        (transaction: Transaction) => console.info("Order Sucessfull"),
        err => console.error(err),
        () => console.info("Complete")
    );