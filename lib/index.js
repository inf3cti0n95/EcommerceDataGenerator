"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var rxjs_1 = require("rxjs");
var utils_1 = require("./utils");
var TransactionSystem_1 = require("./TransactionSystem");
var transactionSystem = new TransactionSystem_1.TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278 * 1000),
    totalCustomer: 10000,
    totalProducts: 52010
}, mysql_1.createConnection("mysql://root@localhost/ecomm"));
transactionSystem.orderReceived$()
    .mergeMap(function (transaction) {
    console.log(transaction.order.status, transaction.order.orderId);
    var processedtransaction = __assign({}, transaction, { order: __assign({}, transaction.order, { status: "PROCESSED" }) });
    return rxjs_1.Observable.of(processedtransaction);
})
    .mergeMap(function (transaction) {
    console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp);
    var shippedtransaction = __assign({}, transaction, { order: __assign({}, transaction.order, { status: "SHIPPED", timestamp: new Date(new Date(transaction.order.timestamp).getTime() + utils_1.generateRandomInt(1, 3) * 24 * 60 * 60 * 1000) }) });
    return rxjs_1.Observable.of(shippedtransaction);
})
    .mergeMap(function (transaction) {
    console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp);
    var shippedtransaction = __assign({}, transaction, { order: __assign({}, transaction.order, { status: "DELIVERED", timestamp: new Date(new Date(transaction.order.timestamp).getTime() + utils_1.generateRandomInt(1, 7) * 24 * 60 * 60 * 1000) }) });
    return rxjs_1.Observable.of(shippedtransaction);
})
    .repeatWhen(function () { return rxjs_1.Observable.interval(2000); })
    .subscribe(function (transaction) { return console.log(transaction.order.status, transaction.order.orderId, transaction.order.timestamp); }, function (err) { return console.error(err); }, function () { return console.info("complete"); });
//# sourceMappingURL=index.js.map