# Ecommerce Data Generator

Generate Ecommerce Transaction Data

## Setup

Create tables in mysql with data in **data/ecomm.sql** file

```
sudo npm install -g typescript
npm install
```

## Run on CLI

```
npm start

```


## Save to MongoDB

```
npm mongo

```

## env Config File

```

DBAddress=mysql://root@localhost/ecomm  //Link to Mysql db where customer and products data is stored
startTime=12345678 //Unix timestamp to start system from
endTime=123556 //Unix timestamp to end system
mongoDatabaseName=transact // name of the mongodatabase
mongoCollectionName=transactions // name of the collection to store to
mongoDBConnectionString=mongodb://localhost:27017/ // mongodb connection string 
initialOrderNumber=100 //Initial Order Number to start from
speed=10 // Speed to to generate transactions in ms

```

### Kafka Producer to Stream Transactions on [kafka branch](https://github.com/inf3cti0n95/EcommerceDataGenerator/tree/kafka)

### MongoDB to Store Transactions on [mongo branch](https://github.com/inf3cti0n95/EcommerceDataGenerator/tree/mongo)
