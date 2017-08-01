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

const startSystemTime = new Date(process.env.startSystemTime || new Date(1501372800 * 1000).toDateString())
const SERVER_ADDRESS = process.env.kafkaServerAddress || "localhost:2181";
const DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
const connection = createConnection(DB_ADDRESS);

const kafkaClient = new Client(SERVER_ADDRESS)
const kafkaProducer = new Producer(kafkaClient);

new RxSQL(connection).query<[any]>("SELECT count(1) as noOfProducts from products")
    .mergeMap(noOfProducts => new RxSQL(connection).query<[any]>("SELECT count(1) as noOfCustomers  from customers")
        .map(noOfCustomers => ({
            ...noOfCustomers[0], ...noOfProducts[0]
        }))
    )
    .subscribe(
    (result) => {
        console.log(result)
        const transactionSystem = new TransactionSystem({
            startOrderNumber: 1,
            startSystemTime: startSystemTime,
            totalCustomer: result.noOfCustomers,
            totalProducts: result.noOfProducts
        }, connection);

        const kafkaTopicName = process.env.kafkaTopicName || "TutorialTopic";

        transactionSystem.orderReceived$()
            .filter((transaction: Transaction) => transaction.order.amount !== 0)
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

            .subscribe(
            (transaction: Transaction) => console.info(transaction.order.orderId, "FIN"),
            err => console.error(err),
            () => console.info("Complete")
            );
    },
        (err) => console.error(err),
        () => ("System Finish")

    )