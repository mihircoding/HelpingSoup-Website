const LocalStrategy = require ('passport-local').Strategy
const bcrypt = require('bcrypt')
const DbService = require('./dBConnection.js');
const db = DbService.getDbServiceInstance();
 function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        const user = await db.getLogin(email);
        if (user == null) {
            return done(null, false, {message: "no user with that email"})
        }

        try {
            const hashedPass = bcrypt.hash(password, 10);
            if (hashedPass == user.password) {
                console.log("password matched")
                return done(null, user)

            } else {
                return done(null, false, {message: 'Password incorrect'})
            }
        
        } catch (error) {
            return done(error)
        }
    }
    
    passport.use(new LocalStrategy({ usernameField: 'email'},
     authenticateUser))
    passport.serializeUser((user,done) => done(null, user.id))
    passport.deserializeUser(async (id,done) => {
        const user = await db.getUserById(id);
        return done(null, user);
    })
}

module.exports = initialize
