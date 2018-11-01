const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const localStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const uuidv4 = require('uuid/v4');
const users = require('./data/user');
app.listen(3000, ()=>console.log("server running..."));

//body-parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//session
app.use(session({
    secret: "cats",
    saveUninitialized: false,
    resave: false,
    cookie:{
       maxAge: 1000*60*5 //live in 5 minutes
    }
}));
//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());


app.set("view engine", "ejs");
app.set("views", "./views");

//render home page
app.get("/", (req, res)=>{
    let isAu = req.isAuthenticated(); //Boolean
    res.render("home", {isAu: isAu});
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
//private page
app.get("/profile", (req, res)=>{
    if(req.isAuthenticated()){
        res.render('profile', {user: req.user});
    }else{
        res.redirect('/login');
    }
})
//route signup
let su = null;
app.route("/signup")
.get((req, res)=>{
    res.render("signup", {signupMessage: su});
    su = null;
})
.post((req, res)=>{
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;
    let birthday = req.body.birthday;
    let index = users.map((e)=>e.user).indexOf(username);
    if(index < 0){ //username is not exist
        users.push({id: uuidv4(), name: name, user: username, pwd: password, birthday: birthday});
        su = true;
        res.redirect("/signup");
    }else{
        su = false;
        res.redirect("/signup");
    }
})

//route login
app.route("/login")
.get((req, res)=>{
    let mess = req.flash('loginMessage');
    res.render("login", {loginMessage: mess});
})
.post(
    passport.authenticate("local", {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true,
    })
);


//tiến hành chứng thực
passport.use(new localStrategy(
    {passReqToCallback : true},
    (req, username, password, done)=>{
        //lay data so sanh
        let record = users.find(data => data.user == username);
        if(!record)
            return done(null, false, req.flash('loginMessage', 'No user found.'));
        if(record.pwd != password)
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
        return done(null, record);
    }
));

//used to serialize the user for the session
passport.serializeUser((user, done)=>{
    done(null, user.id);
});

passport.deserializeUser((id, done)=>{ //id == user.id(serializeUser send)
    let record = users.find(data => data.id == id);
    if(record)
        return done(null, record);
    else
        return done(null, false);
}) 