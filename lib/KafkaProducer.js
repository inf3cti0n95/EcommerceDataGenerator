"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
exports.kafkaProducer$ = function (kafkaProducer, messages, topic) {
    return rxjs_1.Observable.create(function (observer) {
        kafkaProducer.send([{ messages: JSON.stringify(messages), topic: topic }], function (err, data) {
            if (err)
                observer.error(err);
            else
                observer.next(data);
            observer.complete();
        });
    });
};
//# sourceMappingURL=KafkaProducer.js.map