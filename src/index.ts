import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";
import { Chance } from "chance";
import { TransactionSystem } from "./TransactionSystem";
import { existsSync } from "fs";
import { config } from "dotenv";

let envFilePath = ".env";

if(existsSync(".env.production"))
    envFilePath = ".env.production"

if(existsSync(".env.local"))
    envFilePath = ".env.local"

config({
    path: envFilePath
})


const startOrderNumber: any = process.env.initialOrderNumber || 1;
let startTime: any = process.env.startTime || Date.now()/1000;
const startSystemTime = new Date(startTime * 1000)
const DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
console.log("MySQL DB Address", DB_ADDRESS);
const connection = createConnection(DB_ADDRESS);

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
    .mergeMap(
        (transaction: Transaction) => transactionSystem.orderProcessed$(transaction)
            .map(transaction => {
                console.log(JSON.stringify(transaction))
                return transaction
            })
    )
    .mergeMap<Transaction,Transaction>(
        (transaction: Transaction) => (Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
            .map(transaction => {
                // If Shipped
                console.log(JSON.stringify(transaction))
                return transaction
            })
            .catch(transaction => {
                // If Cancelled
                console.log(JSON.stringify(transaction))
                return Observable.empty()
            })
    )
    .mergeMap<Transaction,Transaction>(
        (transaction: Transaction)  => (Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
            .map(transaction => {
                // If Delivered
                console.log(JSON.stringify(transaction))
                return transaction
            })
            .catch(transaction => {
                // If Returned
                console.log(JSON.stringify(transaction))
                return Observable.empty()
            })
    )
    .repeatWhen(() => Observable.interval(2000))
    // .takeWhile(() => transactionSystem.lastOrderNumber < 5)
    .subscribe(
        (transaction: Transaction) => console.log(transaction.order.status, transaction.order.orderId, transaction.timestamp),
        err => console.error(err),
        () => console.info("complete")
    );
},
(err) => console.error(err),
() => ("System Finish")
)