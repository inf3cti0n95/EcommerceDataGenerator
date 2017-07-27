import { IConnection } from "mysql";
import { Observable } from "rxjs";
export declare const orderPayed: (connection: IConnection, data: any) => Observable<any>;
