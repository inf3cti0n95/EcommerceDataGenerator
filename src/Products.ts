import { generateRandomInt } from "./utils"

export const generateRandomProducts = () => {
    let arrayOfProducts = [];
    
    for(let i =0;i<generateRandomInt(1,5);i++){
        arrayOfProducts.push(generateRandomInt(1,52010))
    }
    
    return arrayOfProducts
}
