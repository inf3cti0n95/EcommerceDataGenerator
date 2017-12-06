interface CustomerQueryResult {
    customerId: string,
    firstName: string,
    lastName: string,
    gender: "male" | "female",
    address: string,
    city: string,
    state: string,
    country: string,
    zip: number,
    email: string,
    contactNumber: number,
    birthday: string,
    CCType: string,
    CCNumber: string,
    CCExpires: string,
    longitude: number,
    latitude: number      
}