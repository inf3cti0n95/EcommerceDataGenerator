"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = require("mysql");
var utils_1 = require("./utils");
var rx_sql_1 = require("rx-sql");
exports.orderReceived = function (connection, orderId, orderAmount) {
    var customerId = utils_1.generateRandomInt(1, 10000);
    var timeStamp = new Date((1469532278 + (orderId + 10)) * 1000);
    return new rx_sql_1.RxSQL(connection).query(mysql_1.format("INSERT INTO `ecomm`.`orders`(`order_order_status_id_fk`,`order_customer_id_fk`,`order_timestamp`,`order_amount`) VALUES (?,?,?,?);", ['1', customerId, timeStamp, orderAmount]))
        .mapTo({ date: timeStamp, orderId: orderId });
};
//# sourceMappingURL=OrderReceived.js.map