const mysql = require('mysql2');
const dotenv = require('dotenv').config({path:__dirname+'/.env'});
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
var queryList = [];


const config = {
    connectionLimit: process.env.CONNECTIONLIMIT,
    queueLimit: process.env.QUEUELIMIT,
    host: process.env.HOST,
    user: process.env.HSDB_USER,
    password: process.env.HSDB_PASSWORD,
    //database: process.env.DATABASE,
    port: process.env.DB_PORT
};

var createDb = "CREATE DATABASE IF NOT EXISTS helpingsoupdb;";
queryList.push(createDb);
var useDb = "use helpingsoupdb;";
queryList.push(useDb);
var createCustomer = `CREATE TABLE IF NOT EXISTS helpingsoupdb.customer(
    customerID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    customerFirstName VARCHAR(50) NULL,
    customerLastName VARCHAR(50) NULL,
    customerEmail VARCHAR(100) NULL,
    customerStreetAddress VARCHAR(250) NULL,
    customerCity VARCHAR(100) NULL,
    customerState VARCHAR(50) NULL,
    customerZip CHAR(5) NULL,
    firstDate DATE NULL,
    lastDate DATE NULL,
    startTime TIME NULL,
    endTime TIME NULL,
    customerEmailOptIn TINYINT(1) NOT NULL DEFAULT 0,
    goodsNotes VARCHAR(500) NULL
);`
queryList.push(createCustomer);
var createVolunteer = `CREATE TABLE IF NOT EXISTS helpingsoupdb.volunteer(
    volunteerID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    volunteerFirstName VARCHAR(100) NULL,
    volunteerLastName VARCHAR(100) NULL,
    volunteerEmail VARCHAR(100) UNIQUE NOT NULL ,
    volunteerStreetAddress VARCHAR(250) NULL,
    volunteerCity VARCHAR(100) NULL,
    volunteerState VARCHAR(50) NULL,
    volunteerZip CHAR(5) NULL,
    volunteerSchool VARCHAR(100) NULL,
    volunteerPassword VARCHAR(250) NOT NULL,
    volunteerEmailOptIn TINYINT(1) NOT NULL DEFAULT 0
);`;
queryList.push(createVolunteer);
var createVolunteerDelivery = `CREATE TABLE IF NOT EXISTS helpingsoupdb.volunteerdelivery(
    volunteerDeliveryID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    deliveryNotes VARCHAR(500) NULL,
    deliveryStatus VARCHAR(20) NULL,
    volunteerEmail VARCHAR(100) NOT NULL,
    customerID INT NOT NULL,
    FOREIGN KEY (volunteerEmail) REFERENCES volunteer(volunteerEmail),
    FOREIGN KEY (customerID) REFERENCES customer(customerID)
);`;
queryList.push(createVolunteerDelivery);
var createResetTokens = `CREATE TABLE IF NOT EXISTS helpingsoupdb.resettokens(
    tokenID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiration DATETIME NOT NULL,
    createdAt DATETIME NULL,
    updatedAt DATETIME NULL,
    used TINYINT(1) NOT NULL DEFAULT 0
);`
queryList.push(createResetTokens);

class DbService{
    static objHandle=new DbService();
    static getDbServiceInstance() {
        return this.objHandle;
    }
  
    constructor(){
        this.dbPool= mysql.createPool(config);
        this.dbPool.on('connection', function (connection) {
            console.log('DB Connection established');
          
            connection.on('error', function (err) {
              console.error(new Date(), 'MySQL error', err.code);
            });
            connection.on('close', function (err) {
              console.error(new Date(), 'MySQL close', err);
            });
        });
        for(let query of queryList){   
            this.dbPool.query(query,function(err,rows){
                if (err) {
                    console.log("failed to load query ");
                    console.log(err.message);
                    throw err;
                }  
                      
            });
            
        }
    }

    async insertVolunteer(firstName, lastName, email, address, city, state, zip, school, password, emailOpt){
        try{
            var volunteerOpt = 0;
            if(emailOpt){
                volunteerOpt = 1;
            }
            else volunteerOpt = 0;
            const insert = await new Promise((resolve, reject) => {
                const query = "INSERT INTO helpingsoupdb.volunteer (volunteerFirstName, volunteerLastName, volunteerEmail," +
                     " volunteerStreetAddress, volunteerCity, volunteerState," +
                     " volunteerZip, volunteerSchool, volunteerPassword, volunteerEmailOptIn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
                this.dbPool.query(query, [firstName, lastName, email, address, city, state, zip, school, password, emailOpt], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            });
            return insert;
        } catch (error){
            console.log(error);
        }
    }
    async getPassword(email, password){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerPassword FROM helpingsoupdb.volunteer WHERE volunteerEmail = ?;";
                this.dbPool.query(query, [email], (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            })
            //console.log(response);
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async insertDonation(firstName, lastName, email, address, city, state, zip, firstDate, lastDate, startTime, endTime, emailOpt, message){
        try{
            const insert = await new Promise((resolve, reject) => {
                const query = "INSERT INTO helpingsoupdb.customer (customerFirstName, customerLastName, customerEmail," +
                     " customerStreetAddress, customerCity, customerState, customerZip, firstDate, lastDate, startTime, endTime, customerEmailOptIn, goodsNotes)" +
                     " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
                this.dbPool.query(query, [firstName, lastName, email, address, city, state, zip, firstDate, lastDate, startTime, endTime, emailOpt, message], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            });
            return insert;
        } catch(error){
            console.log(error);
        }
    }
    async findEmail(email){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerEmail FROM helpingsoupdb.volunteer WHERE volunteerEmail = ?;";
                this.dbPool.query(query, [email], (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async updateToken(email){
        try{
            const update = await new Promise((resolve, reject) => {
                const query = "UPDATE helpingsoupdb.resettokens SET used = 1 WHERE email = ?;";
                this.dbPool.query(query, [email], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            });
            return update;
        } catch(error){
            console.log(error);
        }
    }
    async createToken(email, expiration, token, createdAt){
        try{
            const insert = await new Promise((resolve, reject) => {
                const query = "INSERT INTO helpingsoupdb.resettokens(email, expiration, token, createdAt) VALUES (?, ?, ?, ?);";
                    this.dbPool.query(query, [email, expiration, token, createdAt], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
                });
            return insert;
        } catch(error){
            console.log(error);
        }
    }
    async deleteTokens(date){
        try{
            const del = await new Promise((resolve, reject) => {
                const query = "DELETE FROM helpingsoupdb.resettokens WHERE expiration < ? OR used = 1;";
                    this.dbPool.query(query, [date], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return del;
        } catch(error){
            console.log(error);
        }
    }
    async findToken(email, token){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT tokenID FROM helpingsoupdb.resettokens WHERE email = ? AND token = ?;";
                    this.dbPool.query(query, [email, token], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async findOldPassword(email){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerPassword FROM helpingsoupdb.volunteer WHERE volunteerEmail = ?;";
                    this.dbPool.query(query, [email], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error)
        }
    }
    async resetPassword(email, password){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "UPDATE helpingsoupdb.volunteer SET volunteerPassword = ? WHERE volunteerEmail = ?;";
                    this.dbPool.query(query, [password, email], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async findEmails(){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerEmail FROM helpingsoupdb.volunteer;";
                    this.dbPool.query(query, [], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async findOptIn(email){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerEmailOptIn FROM helpingsoupdb.volunteer WHERE volunteerEmail = ?;";
                    this.dbPool.query(query, [email], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async getVolunteerEmailDetails(ID){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerFirstName, volunteerLastName FROM helpingsoupdb.volunteerdelivery INNER JOIN helpingsoupdb.volunteer ON helpingsoupdb.volunteerdelivery.volunteerEmail = helpingsoupdb.volunteer.volunteerEmail WHERE helpingsoupdb.volunteerdelivery.customerID = ?;";
                    this.dbPool.query(query, [ID], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async getCustomerEmailDetails(ID){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT customerEmail FROM helpingsoupdb.volunteerdelivery INNER JOIN helpingsoupdb.customer ON helpingsoupdb.volunteerdelivery.customerID = helpingsoupdb.customer.customerID WHERE helpingsoupdb.volunteerdelivery.customerID = ?;";
                    this.dbPool.query(query, [ID], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async findCustomerOptIn(email){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT customerEmailOptIn FROM helpingsoupdb.customer WHERE customerEmail = ?;";
                    this.dbPool.query(query, [email], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async getDonations() {
        try{
            const response = await new Promise((resolve, reject) => {
                const query =  "select * from helpingsoupdb.customer where customerID not in(select customerID from helpingsoupdb.volunteerdelivery);";
                    this.dbPool.query(query, [], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async changeOptIn(email, inOrOut){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "UPDATE helpingsoupdb.volunteer SET volunteerEmailOptIn = ? WHERE volunteerEmail = ?;";
                     this.dbPool.query(query, [inOrOut, email], (err, result) => {
                        if (err) reject(new Error(err.message));
                        resolve(result);
                    })
            });
            return response;
        } catch(error){
            console.log(error);
        }
    }
    async insertSelectedCustomer (notes,status,email,ID) {
        try {
            const response = await new Promise((resolve,reject) => {
                const query = "INSERT INTO helpingsoupdb.volunteerdelivery(deliveryNotes,deliveryStatus,volunteerEmail,customerID) VALUES (?, ?, ?, ?);";
                this.dbPool.query(query, [notes,status,email,ID], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            }); 
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async getSelectedOrders (email) {
        try {
            const response = await new Promise((resolve,reject) => {
                const query = "select a.customerID,a.customerFirstName,a.customerLastName,a.customerEmail,a.customerStreetAddress," +
                "a.firstDate,a.lastDate,a.startTime,a.endTime,a.goodsNotes,b.deliveryStatus from helpingsoupdb.customer a," + 
                "helpingsoupdb.volunteerdelivery b where a.customerID = b.customerID and b.volunteerEmail = ?;";
                this.dbPool.query(query, [email], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async delSelectedOrder (ID) {
        try {
            const response = await new Promise((resolve,reject) => {
                const query = "DELETE FROM helpingsoupdb.volunteerdelivery WHERE customerID = ?;";
                this.dbPool.query(query, [ID], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }
    
    async updateInProgress (ID,Status) {
        try {
            const response = await new Promise((resolve,reject) => {
                const query = "UPDATE helpingsoupdb.volunteerdelivery SET deliveryStatus = ? WHERE customerID = ?;";
                this.dbPool.query(query, [Status,ID], (err, result) => {
                    if (err) reject(new Error(err.message));
                    resolve(result);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async getFirstName (email) {
        try {
            const response = await new Promise((resolve,reject) => {
                const query = "SELECT volunteerFirstName from helpingsoupdb.volunteer WHERE volunteerEmail = ?;";
                this.dbPool.query(query, [email], (err,result) => {
                    if (err) reject (new Error(err.message));
                    resolve(result);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async getLogin(email){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerId as id, volunteerFirstName as name, volunteerPassword as password, volunteerEmail as email FROM helpingsoupdb.volunteer WHERE volunteerEmail = ?;";
                this.dbPool.query(query, [email], (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results[0]);
                })
            })
            console.log(response);
            return response;
        } catch(error){
            console.log(error);
        }
    }

    async getUserById(id){
        try{
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT volunteerId as id, volunteerFirstName as name, volunteerPassword as password, volunteerEmail as email FROM helpingsoupdb.volunteer WHERE volunteerId = ?;";
                this.dbPool.query(query, [id], (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results[0]);
                })
            })
            console.log(response);
            return response;
        } catch(error){
            console.log(error);
        }
    }
}

/** 
class DbService {

    constructor() {
        if (!DbService.instance) {
            DbService.instance = new DbRepo();
        }
    }
  
    static getDbServiceInstance() {
        return DbService.instance;
    }
  
  }
  */

module.exports = DbService;