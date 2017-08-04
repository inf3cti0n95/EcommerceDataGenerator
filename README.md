# Ecommerce Data Generator

Generate Ecommerce Transaction Data

## Setup

Create tables in mysql with data in **data/ecomm.sql** file

```
sudo npm install -g typescript
npm install
```

## Run

```
npm start
```

## env Config File

```

DBAddress=mysql://root@localhost/ecomm  //Link to Mysql db where customer and products data is stored
startSystemTime=12345678 //Unix timestamp to start system from
mongoDatabaseName=transact // name of the mongodatabase
mongoCollectionName=transactions // name of the collection to store to
mongoDBConnectionString=mongodb://localhost:27017/ // mongodb connection string 


```


### Kafka Producer to Stream Transactions on [kafka branch](https://github.com/inf3cti0n95/EcommerceDataGenerator/tree/kafka)
