'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const passport    = require('passport');
const ObjectID    = require('mongodb').ObjectID;
const mongo       = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.set('view engine', 'pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE, (err, client) => {
    if(err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');
        
      let db = client.db('fcc-filemetadata');
      //serialization and app.listen
      passport.serializeUser((user, done) => {
         done(null, user._id);
      });

      passport.deserializeUser((id, done) => {
          db.collection('users').findOne(
              {_id: new ObjectID(id)},
              (err, doc) => {
                  done(null, doc);
              }
          );
      });
      
      passport.use(new LocalStrategy(
        function(username, password, done) {
          db.collection('users').findOne({ username: username }, function (err, user) {
            console.log('User '+ username +' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (password !== user.password) { return done(null, false); }
            return done(null, user);
          });
        }
      ));
      
      app.route('/')
        .get((req, res) => {
          //res.sendFile(process.cwd() + '/views/index.html');
          res.render(process.cwd() + '/views/pug/index.pug', {title: 'Hello', message: 'Please login', showLogin: true});
        });

      app.route('/login')
        .post(
          passport.authenticate('local', {failureRedirect: '/'}),
          (req, res) => {
            console.log(`User ${req.username} attempted to log in.`);
          }
        );

      app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port " + process.env.PORT);
      });
  }
});

