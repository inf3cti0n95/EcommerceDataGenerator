import { IConnection } from "mysql";
import { Observable } from "rxjs";
export declare const orderReceived: (connection: IConnection, orderId: number, orderAmount: number) => Observable<{
    orderDate: Date;
    orderId: number;
    orderAmount: number;
    customerId: number;
}>;
