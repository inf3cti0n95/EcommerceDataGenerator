interface Order {
    orderId: string,
    amount: number,
    status: "RECEIVED" | "PROCESSED" | "SHIPPED" | "DELIVERED" | "RETURNED" | "CANCELLED",
    timestamp: Date,
    orderItems: Array<OrderItem>
}