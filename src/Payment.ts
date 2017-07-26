import { IConnection, format } from "mysql";
import { generateRandomInt } from "./utils"
import { RxSQL } from "rx-sql";
import { Observable } from "rxjs";
import { CustomerID } from "./interfaces/Customer";

export const orderPayed = (connection: IConnection, orderId: number, orderDate: Date ) => {
    let paymentMethod = generateRandomPaymentMethod();
    if(paymentMethod === "COD")
        return Observable.of({paymentMethod: paymentMethod, orderId: orderId, orderDate: orderDate});
    return new RxSQL(connection).query(format("INSERT INTO `ecomm`.`payments` (`payment_order_id_fk`, `payment_method`, `payment_timestamp`) VALUES (?,?,?) ",[orderId,paymentMethod, orderDate]))
        .mapTo({paymentMethod: paymentMethod, orderId: orderId, orderDate: orderDate})
}


const generateRandomPaymentMethod = () => {
    switch(generateRandomInt(6)){
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
}