export const generateRandomInt = (start: number, end?: number) => 
    typeof end === "undefined" ? Math.floor(Math.random() * start) : Math.floor(Math.random() * (end - start) + start);
