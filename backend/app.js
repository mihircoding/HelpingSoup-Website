if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const mysql = require("mysql");
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const passport = require('passport')
const flash = require('express-flash');
const session = require('express-session')
const DbService = require('./dBConnection.js');
const initializePassport = require('./passport-config.js')

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))


new initializePassport(
    passport,
     email => user.find(user => user.email === email),
     id => user.find(user => user.id === id)
)

var transporter = nodemailer.createTransport({
    service: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
});
var frontEnd = process.env.FRONTEND_DOMAIN;
var backEnd = process.env.DOMAIN;

//POST CALLS
app.post('/volunteerSignUp', (request, response) =>{
    const formData = request.body;
    const db = DbService.getDbServiceInstance();
    const result1 = db.getPassword(formData.email)
    result1
    .then(data => {
        if(data.length > 0){
            response.json({success: false});
        }
        else{
            var opt = 0;
            if(formData.emailOpt == "true"){
                opt = 1;
            }
            const hashedPass = bcrypt.hash(formData.password, 10);
            console.log("this is the hash " + hashedPass);
            const result2 = db.insertVolunteer(formData.firstName, formData.lastName, formData.email,
                formData.address, formData.city, formData.state,
                 formData.zip, formData.school, hashedPass, opt);
           result2
           .then(response.json({success: true}));
        }
    })
});

app.post('/volunteerLogin', (request, response) => {
    const formData = request.body;
    const db = DbService.getDbServiceInstance();
    const result = db.getPassword(formData.email, formData.password);
    result
    .then(data => {
        if (checkNotAuthenticated(request,response)) {
            var canLogin = true;
        }
        else{
            var canLogin = false;
        }
        response.json({CanLogin: canLogin});
    });
});

app.post('/forgotPasswordEmail', (request, response) => {
    const formData = request.body;
    const db = DbService.getDbServiceInstance();
    const result1 = db.findEmail(formData.email);
    result1
    .then(data => {
        if(data.length > 0){
            db.updateToken(formData.email);
            var token = crypto.randomBytes(64).toString('base64');
            var expireDate = new Date();
            expireDate.setHours(expireDate.getHours() + 1);
            var createdAt = new Date();
            db.createToken(formData.email, expireDate, token, createdAt);
            const message = {
                from: process.env.EMAIL_USER,
                to: formData.email,
                subject: "HelpingSoup Reset Password",
                text: 'Hello,\n\nTo reset your password, please click the link below.\n\nhttp://' + backEnd + '/user/reset-password?token='+ encodeURIComponent(token) +'&email='+ formData.email +'\n\nSincerely,\n\nThe HelpingSoup Team'
            };
            transporter.sendMail(message, (err, info) => {
                if(err) console.log(err);
                //else console.log(info);
            });
            response.json({success: true});
        }
        else response.json({success: false});
    })
});

app.post('/resetVolunteerPassword', (request, response) => {
    const formData = request.body;
    const db = DbService.getDbServiceInstance();
    const result = db.findOldPassword(userEmail);
    result
    .then(data => {
        if(data[0].volunteerPassword == formData.password){
            response.json({success: false});
        }
        else{
            const result = db.resetPassword(userEmail, formData.password);
            result
            .then(data => response.json({success: true}));
            const result2 = db.updateToken(userEmail);
            userEmail = null;
        }
    });
});

app.post('/donation', (request, response) => {
    const formData = request.body;
    const db = DbService.getDbServiceInstance();
    var opt = 0;
    if(formData.emailOpt == "true"){
        opt = 1;
    }
    const result = db.insertDonation(formData.firstName, formData.lastName, formData.email,
         formData.address, formData.city, formData.state,
         formData.zip, formData.firstDate, formData.lastDate, formData.startTime,
         formData.endTime, opt, formData.message);
    result
    .then(data => response.json({data: data}));
    const result2 = db.findEmails();
    result2
    .then(data => {
        for(var i = 0; i < data.length; i++){
            var currEmail = data[i].volunteerEmail;
            const result3 = db.findOptIn(currEmail);
            result3.then(data2 => {
                if(data2[0].volunteerEmailOptIn == 1){
                    //var time1 = 0;
                    //var time2 = 0;
                    var time1 = timeConvert(formData.startTime);
                    var time2 = timeConvert(formData.endTime);
                    const message = {
                        from: process.env.EMAIL_USER,
                        to: currEmail,
                        subject: "New HelpingSoup Donation",
                        text: 'Hello,\n\nA new donation from ' + formData.firstName + ' ' + formData.lastName + ' has been submitted to HelpingSoup. The donation is available from '  + formData.firstDate + ' to ' + formData.lastDate + ', from ' + time1 + ' to ' + time2 + ' on those days, and it is located at ' + formData.address + ', ' + formData.city + ', ' + formData.state + ' ' + formData.zip + '.\n\nFor more information, click this link: http://' + frontEnd + '/frontend/pages/login.html' + '\n\nIf you want to opt out of these emails, please click the link below.\n\nhttp://' + backEnd + '/optout?email='+ currEmail + '\n\nSincerely,\n\nThe HelpingSoup Team'
                    };
                    transporter.sendMail(message, (err, info) => {
                        if(err) console.log(err);
                        //else console.log(info);
                    });
                }
            });
        }
    });
});

app.get('/optout', (request, response) => {
    const db = DbService.getDbServiceInstance();
  
    db.changeOptIn(request.user.email);
    response.writeHead(302, {Location: frontEnd + '/frontend/pages/changedOptIn.html'});
    response.end();
});

app.post('/api/SelectingOrders',(request,response) => {
    const formData = request.body;
    const db = DbService.getDbServiceInstance();
    const result = db.insertSelectedCustomer(formData.deliveryNotes,formData.deliveryStatus,formData.volunteerEmail,formData.customerID);
    result
    .then(response.json({success: true}));
});

//GET CALLS
app.get('/user/reset-password', (request, response) => {
    
    //delete expired or used tokens
    const db = DbService.getDbServiceInstance();
    const curDate = new Date();
    db.deleteTokens(curDate);

    //find token
    const result = db.findToken(request.user.email, request.query.token);
    result
    .then(data => {
        if(data.length > 0){
            console.log('token found!');
            //login.navigate('http://' + process.env.FRONTEND_DOMAIN + '/frontend/pages/forgetpassword.html');
            //response.writeHead(302, {Location: 'http://' + process.env.FRONTEND_DOMAIN + '/frontend/pages/forgetpassword.html'});
            response.writeHead(302, {Location: frontEnd + '/frontend/pages/forgotpassword.html'});
            userEmail = request.user.email;
            response.end();
        }
        else{
            console.log('your token has expired or no token as been found, sorry');
            //login.navigate('http://' + process.env.FRONTEND_DOMAIN + '/frontend/pages/error.html');
            //response.writeHead(302, {Location: 'http://' + process.env.FRONTEND_DOMAIN + '/frontend/pages/error.html'});
            response.writeHead(302, {Location: frontEnd + '/frontend/pages/error.html'});
            response.end();
        }
    });
});

app.get('/api/GetAllOrders', (request, response) => {
    const db = DbService.getDbServiceInstance();
    const result= db.getDonations();
    result
    .then(data => {
            response.send(data);
    });
    
});

app.get('/api/GetAllSelectedOrders', (request, response) => {
    const email = request.user.email;
    const db = DbService.getDbServiceInstance();
    const result = db.getSelectedOrders(email);

    result
    .then(data =>{
        response.send(data);
    });
});

app.delete('/api/delSelectedOrder', (request, response) => {
    const ID = request.user.id;
    const db = DbService.getDbServiceInstance();
    const result = db.delSelectedOrder(ID);
    result
    .then(response.json({success: true}));
});

app.put('/api/updateStatus', (request, response) => {
    const ID = request.user.id;
    const Status = request.query.deliveryStatus;
    const db = DbService.getDbServiceInstance();
    const result = db.updateInProgress(ID,Status);
    if(Status == "In Progress"){
        const emailCustomer = db.getCustomerEmailDetails(ID);
        emailCustomer
        .then(data => {
            var cEmail = data[0].customerEmail;
            const optIn = db.findCustomerOptIn(cEmail);
            optIn
            .then(data2 => {
                if(data2[0].customerEmailOptIn == 1){
                    const result2 = db.getVolunteerEmailDetails(ID);
                    result2
                    .then(data3 => {
                        const message = {
                            from: process.env.EMAIL_USER,
                            to: cEmail,
                            subject: "HelpingSoup Pickup Alert",
                            text: 'Hello,\n\n\nThis is an email to notify you that ' + data3[0].volunteerFirstName + ' ' + data3[0].volunteerLastName + ' has selected to pick up your donation. Please be ready for the volunteer to come at any time to pick up your donation.\n\nWe greatly appreciate you using our service!\n\n\nSincerely,\n\nThe HelpingSoup Team'
                        };
                        transporter.sendMail(message, (err, info) => {
                            if(err) console.log(err);
                            //else console.log(info);
                        });
                    });
                }
            });
        });
    }
    result
    .then(response.json({success: true}));
});

app.get('/api/getFirstName', (request,response) => {
    const email = request.user.email;
    const db = DbService.getDbServiceInstance();
    const result = db.getFirstName(email);
    result
    .then(data =>{
        response.send(data);
    });
});
//HELPER FUNCTIONS
function timeConvert (time){
    var timeArray = time.split(':');
    time = timeArray[0] + ":" + timeArray[1];

    if (timeArray[0] >= 12) {

        time = time + " PM";
        if (timeArray[0] > 12) {
            var newHour = (timeArray[0] % 12).toString();

            time = newHour + time.substring(2)
        }
    }
    else{
        time = time + " AM";
    }
    return time;
}

function checkAuthenticated(req,res,next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}


function checkNotAuthenticated(req,res,next) {
    if (req.isAuthenticated()) {
        return true;
    }
    else{
        return false;
    }
}


app.listen(process.env.PORT, () => console.log('app is running'));