const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const name = profile.displayName;
      const profilePic = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '';

      let user = await User.findOne({ 
        $or: [
          { googleId: googleId },
          { email: email.toLowerCase() }
        ] 
      });

      if (!user) {
        user = await User.create({
          googleId,
          email: email.toLowerCase(),
          name,
          profilePic
        });
      } else {
        // Update googleId and profilePic if not present
        if (!user.googleId) user.googleId = googleId;
        if (!user.profilePic) user.profilePic = profilePic;
        if (!user.name) user.name = name;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Required even for stateless auth to prevent accidental session-related crashes
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
