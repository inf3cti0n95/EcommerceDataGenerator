"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var rxjs_1 = require("rxjs");
var chance_1 = require("chance");
var TransactionSystem_1 = require("./TransactionSystem");
var transactionSystem = new TransactionSystem_1.TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278 * 1000),
    totalCustomer: 10000,
    totalProducts: 52010
}, mysql_1.createConnection("mysql://root:123456@localhost/ecomm"));
transactionSystem.orderReceived$()
    .mergeMap(function (transaction) { return transactionSystem.orderProcessed$(transaction)
    .map(function (transaction) {
    console.log(JSON.stringify(transaction));
    return transaction;
}); })
    .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
    .map(function (transaction) {
    // If Shipped
    console.log(JSON.stringify(transaction));
    return transaction;
})
    .catch(function (transaction) {
    // If Cancelled
    console.log(JSON.stringify(transaction));
    return rxjs_1.Observable.empty();
}); })
    .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
    .map(function (transaction) {
    // If Delivered
    console.log(JSON.stringify(transaction));
    return transaction;
})
    .catch(function (transaction) {
    // If Returned
    console.log(JSON.stringify(transaction));
    return rxjs_1.Observable.empty();
}); })
    .repeatWhen(function () { return rxjs_1.Observable.interval(2000); })
    .subscribe(function (transaction) { return console.log(transaction.order.status, transaction.order.orderId, transaction.timestamp); }, function (err) { return console.error(err); }, function () { return console.info("complete"); });
//# sourceMappingURL=index.js.map