"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OrderItems_1 = require("./OrderItems");
var OrderReceived_1 = require("./OrderReceived");
var Payment_1 = require("./Payment");
var Shipment_1 = require("./Shipment");
var mysql_1 = require("mysql");
var connection = mysql_1.createConnection("mysql://root@localhost/ecomm");
// Receive Order
OrderItems_1.generateRandomOrderItems(connection)
    .mergeMap(function (orderDetails) {
    return OrderReceived_1.orderReceived(connection, orderDetails.orderId, orderDetails.totalPrice);
})
    .mergeMap(function (orderDetails) {
    return Payment_1.orderPayed(connection, orderDetails.orderId, orderDetails.date);
})
    .mergeMap(function (orderDetails) {
    return Shipment_1.orderShipped(connection, orderDetails.orderId, orderDetails.orderDate, orderDetails.paymentMethod, "DELIVERY");
})
    .subscribe(function (data) { return console.log(data); }, function (err) { return console.log(err); }, function () { return console.log("fin"); });
//# sourceMappingURL=index.js.map