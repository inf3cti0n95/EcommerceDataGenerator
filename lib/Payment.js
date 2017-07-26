"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var utils_1 = require("./utils");
var rx_sql_1 = require("rx-sql");
var rxjs_1 = require("rxjs");
exports.orderPayed = function (connection, orderId, orderDate) {
    var paymentMethod = generateRandomPaymentMethod();
    if (paymentMethod === "COD")
        return rxjs_1.Observable.of({ paymentMethod: paymentMethod, orderId: orderId, orderDate: orderDate });
    return new rx_sql_1.RxSQL(connection).query(mysql_1.format("INSERT INTO `ecomm`.`payments` (`payment_order_id_fk`, `payment_method`, `payment_timestamp`) VALUES (?,?,?) ", [orderId, paymentMethod, orderDate]))
        .mapTo({ paymentMethod: paymentMethod, orderId: orderId, orderDate: orderDate });
};
var generateRandomPaymentMethod = function () {
    switch (utils_1.generateRandomInt(6)) {
        case 1:
            return "CREDITCARD";
        case 2:
            return "DEBITCARD";
        case 3:
            return "WALLET";
        case 4:
            return "COD";
        default:
            return "NETBANKING";
    }
};
//# sourceMappingURL=Payment.js.map