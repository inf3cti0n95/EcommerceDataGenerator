interface Order {
    orderId: number,
    amount: number,
    status: "RECEIVED" | "PROCESSED" | "SHIPPED" | "DELIVERED" | "RETURNED" | "CANCELLED",
    orderItems: Array<OrderItem>
}