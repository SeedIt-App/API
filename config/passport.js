const path = require('path');
const JwtStrategy = require('passport-jwt').Strategy;
const BearerStrategy = require('passport-http-bearer');
const { ExtractJwt } = require('passport-jwt');
const { jwtSecret, googleSecret } = require('./vars');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const authProviders = require(path.resolve('./src/auth/services/authProviders'));
const User = require(path.resolve('./src/user/models/user.model'));

const jwtOptions = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

const jwt = async (payload, done) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

const googleOption = {
  clientID: googleSecret.clientId,
  clientSecret: googleSecret.clientSecret,
  callbackURL: googleSecret.callbackUrl,
  passReqToCallback: googleSecret.passReqToCallback
};

const googleCallback = (request, accessToken, refreshToken, profile, done) => {
  console.log('=====GOOGLE CALLBACK FINCTION=====');
  // console.log(request);
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return done(err, user);
  });
};

const oAuth = service => async (token, done) => {
  try {
    const userData = await authProviders[service](token);
    const user = await User.oAuthLogin(userData);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

exports.jwt = new JwtStrategy(jwtOptions, jwt);
exports.google = new GoogleStrategy(googleOption, googleCallback);
exports.facebook = new BearerStrategy(oAuth('facebook'));

