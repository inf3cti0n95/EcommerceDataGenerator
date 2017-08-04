export const generateRandomInt = (start: number, end?: number) =>
    typeof end === "undefined" ? Math.floor(Math.random() * start) : Math.floor(Math.random() * (end - start) + start);

export const generateRandomDate = (currentDate: Date, start: number, end: number) =>
    new Date(generateRandomInt(new Date(currentDate).getTime() + start * 24 * 60 * 60 * 1000, new Date(currentDate).getTime() + end * 24 * 60 * 60 * 1000))