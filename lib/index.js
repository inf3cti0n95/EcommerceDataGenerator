"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var rxjs_1 = require("rxjs");
var chance_1 = require("chance");
var kafka_node_1 = require("kafka-node");
var dotenv_1 = require("dotenv");
var KafkaProducer_1 = require("./KafkaProducer");
var TransactionSystem_1 = require("./TransactionSystem");
dotenv_1.config();
var SERVER_ADDRESS = process.env.kafkaServerAddress || "localhost:2181";
var DB_ADDRESS = process.env.DBAddress || "mysql://root@localhost/ecomm";
var kafkaClient = new kafka_node_1.Client(SERVER_ADDRESS);
var kafkaProducer = new kafka_node_1.Producer(kafkaClient);
var transactionSystem = new TransactionSystem_1.TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1501372800 * 1000),
    totalCustomer: 10000,
    totalProducts: 202852
}, mysql_1.createConnection(DB_ADDRESS));
var kafkaTopicName = process.env.kafkaTopicName || "TutorialTopic";
transactionSystem.orderReceived$()
    .mergeMap(function (transaction) {
    return KafkaProducer_1.kafkaProducer$(kafkaProducer, transaction, kafkaTopicName).mapTo(transaction);
})
    .mergeMap(function (transaction) { return transactionSystem.orderProcessed$(transaction)
    .mergeMap(function (transaction) { return KafkaProducer_1.kafkaProducer$(kafkaProducer, transaction, kafkaTopicName).mapTo(transaction); }); })
    .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
    .map(function (transaction) {
    console.log(transaction.order.status);
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: kafkaTopicName }], function (err, data) {
        console.log(data);
    });
    return transaction;
})
    .catch(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: kafkaTopicName }], function (err, data) {
        console.log(data);
    });
    return rxjs_1.Observable.empty();
}); })
    .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
    .map(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: kafkaTopicName }], function (err, data) {
        console.log(data);
    });
    return transaction;
})
    .catch(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: kafkaTopicName }], function (err, data) {
        console.log(data);
    });
    return rxjs_1.Observable.empty();
}); })
    .repeatWhen(function () { return transactionSystem.currentSysTime.getTime() < Date.now() ? rxjs_1.Observable.interval(500) : rxjs_1.Observable.interval(5000); })
    .takeWhile(function () { return transactionSystem.lastOrderNumber < (process.env.numberOfTransaction || Infinity); })
    .subscribe(function (transaction) { return console.info(transactionSystem.currentSysTime); }, function (err) { return console.error(err); }, function () { return console.info("Complete"); });
//# sourceMappingURL=index.js.map