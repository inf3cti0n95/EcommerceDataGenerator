import { IConnection } from "mysql";
import { Observable } from "rxjs";
export declare const orderShipped: (connection: IConnection, data: any, shipmentType: string) => Observable<any>;
