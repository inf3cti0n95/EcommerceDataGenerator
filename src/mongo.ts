import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";
import { Chance } from "chance";
import { config } from "dotenv";
import { existsSync } from "fs"
import { TransactionSystem } from "./TransactionSystem";
import * as moment from 'moment';

let envFilePath = ".env";

if(existsSync(".env.production"))
    envFilePath = ".env.production"

if(existsSync(".env.local"))
    envFilePath = ".env.local"

config({
    path: envFilePath
})

const mongodb = require('mongodb');
const RxMongodb = require("rx-mongodb");
const rxMongodb = new RxMongodb(mongodb);
const dbName = process.env.mongoDatabaseName || 'transact';
const collectionName = process.env.mongoCollectionName || 'transactions';
const connectionString = (process.env.mongoDBConnectionString || 'mongodb://localhost:27017/') + dbName;
const DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
const connection = createConnection(DB_ADDRESS);
const hasEndtime = process.env.endTime !== undefined;
const orderCyclePerSec: any = process.env.speed || 100;
const startOrderNumber: any = process.env.initialOrderNumber || 1;

let endTime: any = process.env.endTime || Infinity;
let startTime: any = process.env.startTime || 1501372800;

endTime = eval(endTime) * 1000;
startTime = eval(startTime) * 1000;
const startSystemTime = new Date(startTime)

console.log("mySQL Database Address -", DB_ADDRESS)
console.log("Mongo Database Name -", dbName);
console.log("Mongo Collection Name -", collectionName);
console.log("Mongo Connection String -", connectionString);
console.log("System End Time", new Date(endTime));
console.log("System Start Time", new Date(startTime));
console.log("Start Order Number", startOrderNumber);
console.log("Order Speed", orderCyclePerSec)

new RxSQL(connection).query<[any]>("SELECT count(1) as noOfProducts from products")
    .mergeMap(noOfProducts => new RxSQL(connection).query<[any]>("SELECT count(1) as noOfCustomers  from customers")
        .map(noOfCustomers => ({
            ...noOfCustomers[0], ...noOfProducts[0]
        }))
    )
    .subscribe(
    (result) => {
        console.log("Total Products and Customers in DB", result)
        const transactionSystem = new TransactionSystem({
            startOrderNumber: eval(startOrderNumber),
            startSystemTime: startSystemTime,
            totalCustomer: result.noOfCustomers,
            totalProducts: result.noOfProducts
        }, connection);

        transactionSystem.orderReceived$()
            .filter((transaction: Transaction) => transaction.order.amount !== 0)
            .mergeMap<Transaction, Transaction>((transaction: Transaction) =>
                rxMongodb.connect(connectionString)
                    .mergeMap((db: any) => rxMongodb.insert(collectionName, transaction))
                    .mapTo(transaction)
            )
            .mergeMap<Transaction, Transaction>((transaction: Transaction) => transactionSystem.orderProcessed$(transaction)
                .mergeMap((transaction: Transaction) => rxMongodb.insert(collectionName, transaction))
                .mapTo(transaction)

            )
            .mergeMap<Transaction, Transaction>(
            (transaction: Transaction) => (Chance().bool({ likelihood: 15 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
                .mergeMap((transaction: Transaction) => rxMongodb.insert(collectionName, transaction).mapTo(transaction))
                .catch((transaction: Transaction) => { 
                    rxMongodb.insert(collectionName, transaction).subscribe();
                    console.log("Last Order Number -", transactionSystem.lastOrderNumber, "Order Status -", transaction.order.status);
                    console.log("Current Time -", transactionSystem.currentSysTime.getTime(), "End Time -", endTime)
                    return Observable.empty() })
                
            )
            .mergeMap<Transaction, Transaction>(
            (transaction: Transaction) => (Chance().bool({ likelihood: 10 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
                .mergeMap((transaction: Transaction) => rxMongodb.insert(collectionName, transaction).mapTo(transaction))
                .catch((transaction: Transaction) => {
                    rxMongodb.insert(collectionName, transaction).subscribe();
                    console.log("Last Order Number -", transactionSystem.lastOrderNumber, "Order Status -", transaction.order.status);
                    console.log("Current Time -", transactionSystem.currentSysTime.getTime(), "End Time -", endTime)
                    return Observable.empty()
                })
            )
            .repeatWhen(() => Observable.interval(orderCyclePerSec*10))
            .do((transaction: Transaction) => {
                console.log("Last Order Number -", transactionSystem.lastOrderNumber, "Order Status -", transaction.order.status);
                console.log("Current Time -", transactionSystem.currentSysTime.getTime(), "End Time -", endTime)
            })
            .takeWhile(() => hasEndtime ? transactionSystem.currentSysTime.getTime() < endTime : true)
            .subscribe(
            (transaction: any) => { },
            err => console.error(err),
            () => console.info("Complete")
            );
    },
    (err) => console.error(err),
    () => ("System Finish")
    )