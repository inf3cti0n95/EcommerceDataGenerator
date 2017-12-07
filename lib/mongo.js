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
var dotenv_1 = require("dotenv");
var fs_1 = require("fs");
var TransactionSystem_1 = require("./TransactionSystem");
var envFilePath = ".env";
if (fs_1.existsSync(".env.production"))
    envFilePath = ".env.production";
if (fs_1.existsSync(".env.local"))
    envFilePath = ".env.local";
dotenv_1.config({
    path: envFilePath
});
var mongodb = require('mongodb');
var RxMongodb = require("rx-mongodb");
var rxMongodb = new RxMongodb(mongodb);
var dbName = process.env.mongoDatabaseName || 'transact';
var collectionName = process.env.mongoCollectionName || 'transactions';
var connectionString = (process.env.mongoDBConnectionString || 'mongodb://localhost:27017/') + dbName;
var DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
var connection = mysql_1.createConnection(DB_ADDRESS);
var hasEndtime = process.env.endTime !== undefined;
var orderCyclePerSec = process.env.speed || 100;
var startOrderNumber = process.env.initialOrderNumber || 1;
var endTime = process.env.endTime || Infinity;
var startTime = process.env.startTime || 1501372800;
endTime = eval(endTime) * 1000;
startTime = eval(startTime) * 1000;
var startSystemTime = new Date(startTime);
console.log("mySQL Database Address -", DB_ADDRESS);
console.log("Mongo Database Name -", dbName);
console.log("Mongo Collection Name -", collectionName);
console.log("Mongo Connection String -", connectionString);
console.log("System End Time", new Date(endTime));
console.log("System Start Time", new Date(startTime));
console.log("Start Order Number", startOrderNumber);
console.log("Order Speed", orderCyclePerSec);
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
        .filter(function (transaction) { return transaction.order.amount !== 0; })
        .mergeMap(function (transaction) {
        return rxMongodb.connect(connectionString)
            .mergeMap(function (db) { return rxMongodb.insert(collectionName, transaction); })
            .mapTo(transaction);
    })
        .mergeMap(function (transaction) { return transactionSystem.orderProcessed$(transaction)
        .mergeMap(function (transaction) { return rxMongodb.insert(collectionName, transaction); })
        .mapTo(transaction); })
        .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 15 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
        .mergeMap(function (transaction) { return rxMongodb.insert(collectionName, transaction).mapTo(transaction); })
        .catch(function (transaction) {
        rxMongodb.insert(collectionName, transaction).subscribe();
        console.log("Last Order Number -", transactionSystem.lastOrderNumber, "Order Status -", transaction.order.status);
        console.log("Current Time -", transactionSystem.currentSysTime.getTime(), "End Time -", endTime);
        return rxjs_1.Observable.empty();
    }); })
        .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 10 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
        .mergeMap(function (transaction) { return rxMongodb.insert(collectionName, transaction).mapTo(transaction); })
        .catch(function (transaction) {
        rxMongodb.insert(collectionName, transaction).subscribe();
        console.log("Last Order Number -", transactionSystem.lastOrderNumber, "Order Status -", transaction.order.status);
        console.log("Current Time -", transactionSystem.currentSysTime.getTime(), "End Time -", endTime);
        return rxjs_1.Observable.empty();
    }); })
        .repeatWhen(function () { return rxjs_1.Observable.interval(orderCyclePerSec * 10); })
        .do(function (transaction) {
        console.log("Last Order Number -", transactionSystem.lastOrderNumber, "Order Status -", transaction.order.status);
        console.log("Current Time -", transactionSystem.currentSysTime.getTime(), "End Time -", endTime);
    })
        .takeWhile(function () { return hasEndtime ? transactionSystem.currentSysTime.getTime() < endTime : true; })
        .subscribe(function (transaction) { }, function (err) { return console.error(err); }, function () { return console.info("Complete"); });
}, function (err) { return console.error(err); }, function () { return ("System Finish"); });
//# sourceMappingURL=mongo.js.map