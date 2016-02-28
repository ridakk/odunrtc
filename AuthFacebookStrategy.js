var passport = require('passport'),
    User = require('./models/User'),
    uuid = require('node-uuid'),
  GithubStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: "---",
    clientSecret: "---",
    callbackURL: "---",
    profileFields: ['id', 'displayName', 'photos'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    console.log("facebook profile: %j", profile);

    // check if the user is already logged in
    if (!req.user) {

      // find the user in the database based on their facebook id
      User.findOne({
        'id': profile.id
      }, function(err, user) {

        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
          return done(err);

        // if the user is found, then log them in
        if (user) {
          return done(null, user); // user found, return that user
        } else {
          // if there is no user found with that github id
          var newUser = new User();

          newUser.uuid = uuid.v1();
          newUser.id = profile.id;
          newUser.token = accessToken;
          newUser.username = profile.username;
          newUser.displayName = profile.displayName;
          newUser.photo = profile.photos[0].value;

          // save our user to the database
          newUser.save(function(err) {
            if (err)
              throw err;

            // if successful, return the new user
            return done(null, newUser);
          });
        }

      });

    } else {
      // user already exists and is logged in, we have to link accounts
      var user = req.user; // pull the user out of the session

      // update the current users github credentials
      user.token = accessToken;
      user.username = profile.username;
      user.displayName = profile.displayName;
      user.photo = profile.photos[0].value;

      // save the user
      user.save(function(err) {
        if (err)
          throw err;
        return done(null, user);
      });
    }

  }
));

passport.serializeUser(function(user, done) {
  // placeholder for custom user serialization
  // null is for errors
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  // placeholder for custom user deserialization.
  // maybe you are going to get the user from mongo by id?
  // null is for errors
  done(null, user);
});
