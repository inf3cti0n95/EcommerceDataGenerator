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
var rx_sql_1 = require("rx-sql");
var mysql_1 = require("mysql");
var rxjs_1 = require("rxjs");
var chance_1 = require("chance");
var TransactionSystem_1 = require("./TransactionSystem");
var fs_1 = require("fs");
var dotenv_1 = require("dotenv");
var envFilePath = ".env";
if (fs_1.existsSync(".env.production"))
    envFilePath = ".env.production";
if (fs_1.existsSync(".env.local"))
    envFilePath = ".env.local";
dotenv_1.config({
    path: envFilePath
});
var startOrderNumber = process.env.initialOrderNumber || 1;
var startTime = process.env.startTime || Date.now() / 1000;
var startSystemTime = new Date(startTime * 1000);
var DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
var connection = mysql_1.createConnection(DB_ADDRESS);
new rx_sql_1.RxSQL(connection).query("SELECT count(1) as noOfProducts from products")
    .mergeMap(function (noOfProducts) { return new rx_sql_1.RxSQL(connection).query("SELECT count(1) as noOfCustomers  from customers")
    .map(function (noOfCustomers) { return (__assign({}, noOfCustomers[0], noOfProducts[0])); }); })
    .subscribe(function (result) {
    console.log("Total Products and Customers in DB", result);
    var transactionSystem = new TransactionSystem_1.TransactionSystem({
        startOrderNumber: eval(startOrderNumber),
        startSystemTime: startSystemTime,
        totalCustomer: result.noOfCustomers,
        totalProducts: result.noOfProducts
    }, connection);
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
}, function (err) { return console.error(err); }, function () { return ("System Finish"); });
//# sourceMappingURL=index.js.map