import { Client, Producer } from "kafka-node";
import { Observable } from "rxjs";

export const kafkaProducer$ = (kafkaProducer: Producer, messages: Transaction, topic: string) => {
    return Observable.create((observer: any) => {
        kafkaProducer.send(
            [{ messages: JSON.stringify(messages), topic: topic }],
            (err, data) => {
                if(err)
                    observer.error(err)
                else
                    observer.next(data)
                observer.complete()

            }
        )
    })
}