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

const mongodb = require('mongodb');
const RxMongodb = require("rx-mongodb");
const rxMongodb = new RxMongodb(mongodb);
const dbName = process.env.mongoDatabaseName || 'transact';
const collectionName = process.env.mongoCollectionName  || 'transactions';
let endTime:any;
let startTime: any;
if(process.env.endTime !== undefined)
    endTime = process.env.endTime;

if(process.env.startSystemTime !== undefined)
    startTime = process.env.startSystemTime;
else 
    startTime = 1501372800;

endTime = eval(endTime)*1000;
startTime = eval(startTime) *1000;

const connectionString = (process.env.mongoDBConnectionString || 'mongodb://localhost:27017/') + dbName;


const startSystemTime = new Date(startTime)
const SERVER_ADDRESS = process.env.kafkaServerAddress || "localhost:2181";
const DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
const connection = createConnection(DB_ADDRESS);

const kafkaClient = new Client(SERVER_ADDRESS)
const kafkaProducer = new Producer(kafkaClient);

console.log("mySQL Database Address -",DB_ADDRESS)
console.log("Mongo Database Name -",dbName);
console.log("Mongo Collection Name -",collectionName);
console.log("Mongo Connection String -",connectionString);
console.log("System End Time", new Date(endTime));
console.log("System Start Time", new Date(startTime));

new RxSQL(connection).query<[any]>("SELECT count(1) as noOfProducts from products")
    .mergeMap(noOfProducts => new RxSQL(connection).query<[any]>("SELECT count(1) as noOfCustomers  from customers")
        .map(noOfCustomers => ({
            ...noOfCustomers[0], ...noOfProducts[0]
        }))
    )
    .subscribe(
    (result) => {
        console.log("Total Products and Customers in DB",result)
        const transactionSystem = new TransactionSystem({
            startOrderNumber: 1,
            startSystemTime: startSystemTime,
            totalCustomer: result.noOfCustomers,
            totalProducts: result.noOfProducts
        }, connection);

        const kafkaTopicName = process.env.kafkaTopicName || "TutorialTopic";

        transactionSystem.orderReceived$()
            .filter((transaction: Transaction) => transaction.order.amount !== 0)
            .mergeMap((transaction: Transaction) => 
                rxMongodb.connect(connectionString)
                    .mergeMap((db: any) => rxMongodb.insert(collectionName,transaction))
                    .mapTo(transaction)
            )
            .mergeMap((transaction: Transaction) => transactionSystem.orderProcessed$(transaction)
                .mergeMap((transaction: Transaction) => rxMongodb.insert(collectionName,transaction))
                    .mapTo(transaction)
               
            )
            .mergeMap(
            (transaction: Transaction) => (Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
                .mergeMap((transaction: Transaction) => rxMongodb.insert(collectionName,transaction).mapTo(transaction))
                .catch((transaction: Transaction) => {rxMongodb.insert(collectionName,transaction).subscribe(); return Observable.empty()})
                
                    
                    
            )
            .mergeMap(
            (transaction: Transaction) => (Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
               .mergeMap((transaction: Transaction) => rxMongodb.insert(collectionName,transaction).mapTo(transaction))
                    
                .catch((transaction: Transaction) => {rxMongodb.insert(collectionName,transaction).subscribe(); return Observable.empty()})
                
            )
            .repeatWhen(() => Observable.interval(500))
            .do(() => {
                console.log("Last Order Number -",transactionSystem.lastOrderNumber);
                console.log("Current Time -",transactionSystem.currentSysTime.getTime(),"End Time -",endTime)
            })
            .takeWhile(() => typeof process.env.endTime !== "undefined" ? transactionSystem.currentSysTime.getTime() < endTime : true)
            .subscribe(
            (transaction: any) => {},
            err => console.error(err),
            () => console.info("Complete")
            );
    },
    (err) => console.error(err),
    () => ("System Finish")

    )