import { IConnection } from "mysql";
import { generateRandomInt } from "./utils"
import { RxSQL } from "rx-sql";
import { Observable } from "rxjs";
import { CustomerID } from "./interfaces/Customer";

export default class Customer {
    public customerId: string;
    constructor() {
        
    }

    public static getRandomCustomer = () => {
        return generateRandomInt(0,10000);
    }
}