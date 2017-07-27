import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";

import { TransactionSystem } from "./TransactionSystem";

const transactionSystem = new TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278*1000),
    totalCustomer: 10000,
    totalProducts: 52010
}, createConnection("mysql://root@localhost/ecomm"));

transactionSystem.orderReceived$()
    .mergeMap(
        transaction => {
            console.log(transaction.order.status, transaction.order.orderId)
            let processedtransaction: Transaction = {
                ...transaction,
                order: {
                    ...transaction.order,
                    status: "PROCESSED"
                }
            }
            return Observable.of(processedtransaction)
        }
    )
    .mergeMap(
        transaction => {
            console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp)
            let shippedtransaction: Transaction = {
                ...transaction,
                order: {
                    ...transaction.order,
                    status: "SHIPPED",
                    timestamp: new Date(new Date(transaction.order.timestamp).getTime() + generateRandomInt(1,3)*24*60*60*1000)
                }
            }
            return Observable.of(shippedtransaction)
        }
    )
    .mergeMap(
        transaction => {
            console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp)
            let shippedtransaction: Transaction = {
                ...transaction,
                order: {
                    ...transaction.order,
                    status: "DELIVERED",
                    timestamp: new Date(new Date(transaction.order.timestamp).getTime() + generateRandomInt(1,7)*24*60*60*1000)
                }
            }
            return Observable.of(shippedtransaction)
        }
    )
    .repeatWhen(() => Observable.interval(2000))
    // .takeWhile(() => transactionSystem.lastOrderNumber < 5)
    .subscribe(
        transaction => console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp),
        err => console.error(err),
        () => console.info("complete")
    );
