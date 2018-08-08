var express = require('express');

var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var path = require('path');

app.use(express.static(path.join(__dirname,'./static')));

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

var session = require("express-session");

app.use(session({
    secret: 'alfredofrancisco',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/loginandregistration', { useNewUrlParser: true });

var UserSchema = new mongoose.Schema({
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    birthday: {
        type: Date
    }
});

mongoose.model('User',UserSchema);
var User = mongoose.model('User')

mongoose.Promise = global.Promise;

const bcrypt = require('bcryptjs');

const flash = require('express-flash');
app.use(flash());

app.get('/', function(req, res) {
    res.render('index')
})

app.get('/success', function(req, res) {
    res.render('success')
})

app.post('/registration', function(req, res) {
    //Manual validation
    var err = [];

    if (req.body.first_name.length == 0) {
        err.push("First name field can't be empty");
    }

    if (req.body.last_name.length == 0) {
        err.push("Last name field can't be empty");
    }

    var re = new RegExp('^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$')
    if (req.body.email.length == 0) {
        err.push("Email field can't be empty");
    }
    else if (!req.body.email.match(re)) {
        err.push("Email isn't valid");
    }

    var current_date = new Date();
    var today = Date.parse(current_date)
    var birthday = Date.parse(req.body.birthday)

    if (req.body.birthday.length == 0) {
        err.push("Birthday field can't be empty");
    }
    else if (birthday > today){
        err.push("Trying to trick me? Your birthday needs to be in the past!");
    }

    if (req.body.password.length == 0) {
        err.push("Password can't be empty");
    }

    if (req.body.confirm_password.length == 0) {
        err.push("Confirm password can't be empty");
    }
    else if (req.body.password != req.body.confirm_password) {
        err.push("Both passwords must match!");
    }

    if(err.length > 0){
        for(var msg of err) {
            req.flash('registration',msg);
        }
        res.redirect('/');
    }
    //End of validation
    else {
        //Hashing password
        bcrypt.hash(req.body.password,10,function(err,hash) {
            if (err) {
                console.log("error while hashing password")
            }
            else {
                User.create({ 
                    first_name: req.body.first_name,
                    last_name:req.body.last_name,
                    email:req.body.email,
                    birthday:req.body.birthday,
                    password:hash
                }, function (err) {
                    if (err) {
                        console.log("errors while creating user")
                    }
                    else {
                        console.log("user created with success")
                        res.redirect('/success');
                    }
                });;
            }
        })
    }
})

app.post('/login', function(req, res) {
    //Manual validations
    var err = [];

    var re = new RegExp('^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$')
    if (req.body.email.length == 0) {
        err.push("Email field can't be empty");
    }
    else if (!req.body.email.match(re)) {
        err.push("Email isn't valid");
    }

    if (req.body.password.length == 0) {
        err.push("Password can't be empty");
    }

    if(err.length > 0){
        for(var msg of err) {
            req.flash('login',msg);
        }
        res.redirect('/');
    }
    //End of validation
    else {
        User.find({email:req.body.email},function(err, user) {
            if (err) {
                console.log("error looking for email")
            }
            else {
                if (user.length == 0) {
                    console.log("can't find email")
                    req.flash('login',"Invalid credentials!");
                    res.redirect('/');
                }
                else {
                    console.log("found email")
                    bcrypt.compare(req.body.password, user[0].password)
                        .then( result => {
                            if (result == true ) {
                                console.log("password match")
                                res.redirect('/success');
                            }
                            else {
                                req.flash('login',"Invalid credentials!");
                                res.redirect('/');
                            }
                        })
                        .catch( error => {
                            req.flash('login',"Invalid credentials!");
                            res.redirect('/');
                        })
                }
            }
        })
    }

})

app.listen(8000, function() {
    console.log("listening on port 8000");
})