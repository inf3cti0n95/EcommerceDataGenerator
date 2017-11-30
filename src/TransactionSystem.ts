import { generateRandomInt, generateRandomDate } from "./utils";
import { Observable, Observer } from "rxjs";
import { v1 as uuid } from "uuid";
import { RxSQL } from "rx-sql";
import { IConnection, format } from "mysql";
import * as moment from "moment";

export class TransactionSystem {
    public lastOrderNumber: number
    public currentSysTime: Date
    public systemConfig: ITransactionSystemConfig
    public DbConnection: IConnection;
    constructor(systemConfig: ITransactionSystemConfig, DbConnection: IConnection) {
        this.systemConfig = systemConfig;
        this.currentSysTime = this.systemConfig.startSystemTime;
        this.lastOrderNumber = this.systemConfig.startOrderNumber;
        this.DbConnection = DbConnection;
    }
    private getOrderDate = () => {
        let dayFactor = parseInt(moment(this.currentSysTime).format("DDD"), 10)
        dayFactor += 366 * parseInt(moment(this.currentSysTime).format("YY"), 10) - parseInt(moment(this.systemConfig.startSystemTime).format("YY"), 10)
        if (this.currentSysTime.getTime() < Date.now())
            this.currentSysTime = new Date(this.currentSysTime.getTime() + (generateRandomInt(60000, 300000) * 100 / dayFactor))
        else
            this.currentSysTime = new Date(Date.now())
        return this.currentSysTime;
    }

    private getOrderId = () => {
        this.lastOrderNumber = this.lastOrderNumber + 1;
        return this.lastOrderNumber
    }

    private getCustomer = () => {
        return new RxSQL(this.DbConnection).query<Customer[]>(format("SELECT * FROM customers WHERE customerId=?", [generateRandomInt(1, this.systemConfig.totalCustomer)]))
            .flatMap(result => result)
            .map(result => {
                let tempCustomer: Customer = {
                    ...result
                }
                return tempCustomer
            })
            .take(1)
    }

    private getProducts = () => {
        let listOfProducts = `(${this.generateRandomProducts().toString()})`
        return new RxSQL(this.DbConnection).query<ProductQueryResult[]>("SELECT * from products WHERE productId in " + listOfProducts)
            .flatMap(results => results)
            .map(result => {
                let tempProduct: Product = {
                    categories: JSON.parse(result.categories),
                    productPrice: result.price,
                    productId: result.productId,
                    productName: result.title
                }
                return tempProduct
            })
    }

    private getOrderItems = () =>
        this.getProducts().map(product => {
            let orderItem: OrderItem = {
                product: product,
                quantity: generateRandomInt(1, 5)
            }
            return orderItem
        }).toArray()

    private getCustomerAndOrderItems = () => {
        return this.getCustomer()
            .mergeMap(customer => this.getOrderItems().map(orderItems => ({ orderItems, customer })))
    }

    private generateRandomProducts = () => {
        let arrayOfProducts = [];

        for (let i = 0; i < generateRandomInt(1, 5); i++) {
            arrayOfProducts.push(generateRandomInt(1, this.systemConfig.totalProducts))
        }

        return arrayOfProducts
    }

    orderReceived$ = () =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
            this.getCustomerAndOrderItems()
                .subscribe(result => {
                    let transaction: Transaction = {
                        _id: uuid(),
                        customer: result.customer,
                        order: {
                            orderItems: result.orderItems,
                            amount: result.orderItems.reduce((amount, orderItem) => amount + (orderItem.quantity * orderItem.product.productPrice), 0),
                            orderId: this.getOrderId(),
                            status: "RECEIVED"
                        },
                        timestamp: this.getOrderDate()

                    }
                    observer.next(transaction)
                    observer.complete()
                })
        })
    orderProcessed$ = (transaction: Transaction) =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
            let processedTransaction: Transaction = {
                ...transaction,
                _id: uuid(),
                order: {
                    ...transaction.order,
                    status: "PROCESSED",
                },
                timestamp: generateRandomDate(transaction.timestamp, 0, 1)
            }
            observer.next(processedTransaction)
            observer.complete()
        })

    orderShipped$ = (transaction: Transaction) =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
            let shippedTransaction: Transaction = {
                ...transaction,
                _id: uuid(),
                order: {
                    ...transaction.order,
                    status: "SHIPPED",
                },
                timestamp: generateRandomDate(new Date(transaction.timestamp), 1, 3)

            }
            observer.next(shippedTransaction)
            observer.complete()
        })

    orderDelivered$ = (transaction: Transaction) =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
            let deliveredTransaction: Transaction = {
                ...transaction,
                _id: uuid(),
                order: {
                    ...transaction.order,
                    status: "DELIVERED",
                },
                timestamp: generateRandomDate(new Date(transaction.timestamp), 2, 7)

            }
            observer.next(deliveredTransaction)
            observer.complete()
        })

    orderCancelled$ = (transaction: Transaction) =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
            let cancelledTransaction: Transaction = {
                ...transaction,
                _id: uuid(),
                order: {
                    ...transaction.order,
                    status: "CANCELLED"
                },
                timestamp: generateRandomDate(new Date(transaction.timestamp), 1, 3)
            }
            observer.error(cancelledTransaction)
            observer.complete()
        })

    orderReturned$ = (transaction: Transaction) =>
        new Observable<Transaction>((observer: Observer<Transaction>) => {
            let returnedTransaction: Transaction = {
                ...transaction,
                _id: uuid(),
                order: {
                    ...transaction.order,
                    status: "RETURNED",
                },
                timestamp: generateRandomDate(new Date(transaction.timestamp), 2, 7)
            }
            observer.error(returnedTransaction)
            observer.complete()
        })
}