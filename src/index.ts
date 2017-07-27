import { RxSQL } from "rx-sql";
import { createConnection } from "mysql";
import { Observable } from "rxjs";
import { generateRandomInt } from "./utils";
import { Chance } from "chance";

import { TransactionSystem } from "./TransactionSystem";

const transactionSystem = new TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278*1000),
    totalCustomer: 10000,
    totalProducts: 52010
}, createConnection("mysql://root@localhost/ecomm"));

transactionSystem.orderReceived$()
    .mergeMap(
        transaction => transactionSystem.orderProcessed$(transaction)
    )
    .mergeMap(
        transaction => {            
            return Chance().bool({likelihood: 20}) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction)
        }
    )
    .mergeMap(
        transaction => {
            return Chance().bool({likelihood: 15}) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction)
        }
    )
    .repeatWhen(() => Observable.interval(2000))
    // .takeWhile(() => transactionSystem.lastOrderNumber < 5)
    .subscribe(
        transaction => console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp),
        err => console.error(err),
        () => console.info("complete")
    );