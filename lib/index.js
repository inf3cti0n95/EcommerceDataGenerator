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
var kafka_node_1 = require("kafka-node");
var dotenv_1 = require("dotenv");
var TransactionSystem_1 = require("./TransactionSystem");
dotenv_1.config();
var mongodb = require('mongodb');
var RxMongodb = require("rx-mongodb");
var rxMongodb = new RxMongodb(mongodb);
var dbName = process.env.mongoDatabaseName || 'transact';
var collectionName = process.env.mongoCollectionName || 'transactions';
var connectionString = (process.env.mongoDBConnectionString || 'mongodb://localhost:27017/') + dbName;
console.log(dbName, collectionName, connectionString);
var startSystemTime = new Date(process.env.startSystemTime || new Date(1501372800 * 1000).toDateString());
var SERVER_ADDRESS = process.env.kafkaServerAddress || "localhost:2181";
var DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
var connection = mysql_1.createConnection(DB_ADDRESS);
var kafkaClient = new kafka_node_1.Client(SERVER_ADDRESS);
var kafkaProducer = new kafka_node_1.Producer(kafkaClient);
new rx_sql_1.RxSQL(connection).query("SELECT count(1) as noOfProducts from products")
    .mergeMap(function (noOfProducts) { return new rx_sql_1.RxSQL(connection).query("SELECT count(1) as noOfCustomers  from customers")
    .map(function (noOfCustomers) { return (__assign({}, noOfCustomers[0], noOfProducts[0])); }); })
    .subscribe(function (result) {
    console.log(result);
    var transactionSystem = new TransactionSystem_1.TransactionSystem({
        startOrderNumber: 1,
        startSystemTime: startSystemTime,
        totalCustomer: result.noOfCustomers,
        totalProducts: result.noOfProducts
    }, connection);
    var kafkaTopicName = process.env.kafkaTopicName || "TutorialTopic";
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
        .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
        .mergeMap(function (transaction) { return rxMongodb.insert(collectionName, transaction).mapTo(transaction); })
        .catch(function (transaction) { rxMongodb.insert(collectionName, transaction).subscribe(); return rxjs_1.Observable.empty(); }); })
        .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
        .mergeMap(function (transaction) { return rxMongodb.insert(collectionName, transaction).mapTo(transaction); })
        .catch(function (transaction) { rxMongodb.insert(collectionName, transaction).subscribe(); return rxjs_1.Observable.empty(); }); })
        .repeatWhen(function () { return rxjs_1.Observable.interval(500); })
        .takeWhile(function () { return transactionSystem.lastOrderNumber < (process.env.numberOfTransaction || Infinity); })
        .subscribe(function (transaction) { return console.info("FIN"); }, function (err) { return console.error(err); }, function () { return console.info("Complete"); });
}, function (err) { return console.error(err); }, function () { return ("System Finish"); });
//# sourceMappingURL=index.js.map