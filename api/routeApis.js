require('dotenv').config();
const route = require('express')()
const db = require('../database/dbConfig')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

function generateToken(user) {
    const payload = {
      subject: user.id,
      username: user.username,
      roles: ['sales', 'marketing', "CIA"], // this will come from the database
    };
  
    const secret = process.env.JWT_SECRET;
    const options = {
      expiresIn: '10m',
    };
  
    return jwt.sign(payload, secret, options);
  }
  
  
function protected(req, res, next) {
    // token is normally sent in the the Authorization header
    const token = req.headers.authorization;
  
    if (token) {
      // is it valid
      console.log('protected  token = ', token);
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
          // token is invalid
          next(new Error("invalid token WHYWHY"));
          
        } else {
          // token is gooooooooooood
          console.log('protected  token is good ');
          req.decodedToken = decodedToken;
          next();
        }
      });
    } else {
      // bounced
      next(new Error("token not provided"));
         }
  }

function checkRole(role) {
    return function(req, res, next) {
             if (req.decodedToken && req.decodedToken.roles.includes(role)) {
        next();
      } else {
        res.status(403).json({ message: 'you have no access to this resource' });
      }
    };
  }



const login = (req, res, next) => {
    const creds = req.body;


    db('users')
        .where({username : creds.username})
        .first()
        .then(user => {
   
            if(user && bcrypt.compareSync(creds.password, user.password)){

                const token = generateToken(user);
  
                res.status(200).json(token)
            }
            else{ res.status(401).json({message : "You shall not PASS !!"})}
        })
        
        .catch( () =>   next(new Error("could not login")));
    }

// register a new user
// hash password before saving to DB
const registerUser = (req, res, next) => {
    
    const newUser = req.body;
    const hash = bcrypt.hashSync(newUser.password, 4);

    newUser.password = hash;
console.log('registerUser newUser = ', newUser);
    db('users')
        .insert(newUser)
        .then(ids =>{res.status(200).json(ids)})
        .catch((err)=>
        res.status(500).json({ message: 'could not add', err }))
};


const getUsers = (req, res, next) => {

    db('users')
        .select('*')
        .then(users =>{res.status(200).json(users)})
        .catch((err)=>
 res.status(500).json({ message: 'could not get users', err }))
};






// Register
route.post('/register', registerUser)
// GET USERS
route.get('/users', protected,  getUsers)
// LOGIN
route.post('/login', login)

// check server
route.get('/', (req, res) => {
    res.send("route is RUNNING !");
})




module.exports = (server) => {
/*    for restricted url, apply middleware.  
    server.use('api/restricted', protectedFunc);
    server.use('api/restricted', protectRoute;
*/

    server.use('/api', route)
  }


