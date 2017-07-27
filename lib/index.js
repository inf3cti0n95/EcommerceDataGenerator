"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var rxjs_1 = require("rxjs");
var chance_1 = require("chance");
var kafka_node_1 = require("kafka-node");
var TransactionSystem_1 = require("./TransactionSystem");
var SERVER_ADDRESS = "localhost:2181";
var kafkaClient = new kafka_node_1.Client(SERVER_ADDRESS);
var kafkaProducer = new kafka_node_1.Producer(kafkaClient);
var transactionSystem = new TransactionSystem_1.TransactionSystem({
    startOrderNumber: 1,
    startSystemTime: new Date(1469532278 * 1000),
    totalCustomer: 10000,
    totalProducts: 52010
}, mysql_1.createConnection("mysql://root@localhost/ecomm"));
transactionSystem.orderReceived$()
    .mergeMap(function (transaction) { return transactionSystem.orderProcessed$(transaction)
    .map(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: "TutorialTopic" }], function (err, data) {
        console.log(data);
    });
    return transaction;
}); })
    .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 20 }) ? transactionSystem.orderCancelled$(transaction) : transactionSystem.orderShipped$(transaction))
    .map(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: "TutorialTopic" }], function (err, data) {
        console.log(data);
    });
    return transaction;
})
    .catch(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: "TutorialTopic" }], function (err, data) {
        console.log(data);
    });
    return rxjs_1.Observable.empty();
}); })
    .mergeMap(function (transaction) { return (chance_1.Chance().bool({ likelihood: 15 }) ? transactionSystem.orderReturned$(transaction) : transactionSystem.orderDelivered$(transaction))
    .map(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: "TutorialTopic" }], function (err, data) {
        console.log(data);
    });
    return transaction;
})
    .catch(function (transaction) {
    kafkaProducer.send([{ messages: JSON.stringify(transaction), topic: "TutorialTopic" }], function (err, data) {
        console.log(data);
    });
    return rxjs_1.Observable.empty();
}); })
    .repeatWhen(function () { return rxjs_1.Observable.interval(500); })
    .subscribe(function (transaction) { return console.info("Order Sucessfull"); }, function (err) { return console.error(err); }, function () { return console.info("Complete"); });
//# sourceMappingURL=index.js.map