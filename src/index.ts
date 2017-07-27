import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";
import { Chance } from "chance";

import { TransactionSystem } from "./TransactionSystem";

const transactionSystem = new TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278 * 1000),
    totalCustomer: 10000,
    totalProducts: 52010
}, createConnection("mysql://root@localhost/ecomm"));

transactionSystem.orderReceived$()
    .mergeMap(
        (transaction: Transaction) => transactionSystem.orderProcessed$(transaction)
            .map(transaction => {
                console.log(JSON.stringify(transaction))
                return transaction
            })
    )
    .mergeMap(
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
    .mergeMap(
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
        (transaction: Transaction) => console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp),
        err => console.error(err),
        () => console.info("complete")
    );