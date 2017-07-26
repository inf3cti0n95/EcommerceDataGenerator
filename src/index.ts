import Customer from "./Customer";
import { generateRandomProducts }  from "./Products";
import { generateRandomOrderItems }  from "./OrderItems";
import { orderReceived } from "./OrderReceived";
import { orderPayed } from "./Payment";
import { orderShipped } from "./Shipment";


import { createConnection } from "mysql";
let connection = createConnection("mysql://root@localhost/ecomm");

// Receive Order
generateRandomOrderItems(connection)
    .mergeMap(orderDetails => {
        return orderReceived(connection, orderDetails.orderId, orderDetails.totalPrice)
    })
    .mergeMap(orderDetails => {
        return orderPayed(connection, orderDetails.orderId, orderDetails.date)
    })
    .mergeMap(orderDetails => {
        return orderShipped(connection,orderDetails.orderId, orderDetails.orderDate,orderDetails.paymentMethod, "DELIVERY")
    })
.subscribe(data => console.log(data), err => console.log(err), ()=> console.log("fin"));


