import { IConnection } from "mysql";
import { Observable } from "rxjs";
export declare const orderReceived: (connection: IConnection, orderId: number, orderAmount: number) => Observable<{
    date: Date;
    orderId: number;
}>;
