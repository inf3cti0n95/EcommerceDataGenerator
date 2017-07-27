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
var utils_1 = require("./utils");
var rx_sql_1 = require("rx-sql");
var uuid_1 = require("uuid");
exports.orderShipped = function (connection, data, shipmentType) {
    var orderId = data.orderId, orderDate = data.orderDate, paymentMethod = data.paymentMethod;
    var shipDate = new Date(new Date(orderDate).getTime() + utils_1.generateRandomInt(1, 3) * 24 * 60 * 60 * 1000);
    var trackNo = uuid_1.v1().split("-").pop();
    console.log(shipDate);
    return new rx_sql_1.RxSQL(connection).query(mysql_1.format("INSERT into shipments (shipment_order_id_fk, shipment_tracking_number, shipment_timestamp, shipment_type ) values (?,?,?,?) ", [orderId, trackNo, shipDate, shipmentType]))
        .mergeMap(function (resp) { return new rx_sql_1.RxSQL(connection).query(mysql_1.format("INSERT INTO orders (`order_id`, `order_order_status_id_fk`,`order_customer_id_fk`,`order_timestamp`,`order_amount`) VALUES (?,?,?,?,?)", [data.orderId, '3', data.customerId, shipDate, data.orderAmount])); })
        .mapTo(__assign({}, data, { shipDate: shipDate, shipmentType: shipmentType }));
};
//# sourceMappingURL=Shipment.js.map