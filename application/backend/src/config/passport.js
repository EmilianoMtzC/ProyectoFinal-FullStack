const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { BACKEND_URL } = require('./oauth');
const { findOrCreateOAuthUser } = require('../controllers/authController');

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const githubClientId = process.env.GITHUB_CLIENT_ID || '';
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '';

if (googleClientId && googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: `${BACKEND_URL}/api/auth/google/callback`
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || (profile._json && profile._json.email) || null;
                    const avatarUrl = profile.photos && profile.photos[0] && profile.photos[0].value;
                    const user = await findOrCreateOAuthUser({
                        provider: 'google',
                        providerId: profile.id,
                        email,
                        username: profile.displayName || profile.id,
                        displayName: profile.displayName || profile.username || '',
                        avatarUrl
                    });
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );
}

if (githubClientId && githubClientSecret) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: githubClientId,
                clientSecret: githubClientSecret,
                callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
                scope: ['user:email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || (profile._json && profile._json.email) || null;
                    const avatarUrl = profile.photos && profile.photos[0] && profile.photos[0].value;
                    const user = await findOrCreateOAuthUser({
                        provider: 'github',
                        providerId: profile.id,
                        email,
                        username: profile.username || profile.displayName || profile.id,
                        displayName: profile.displayName || profile.username || '',
                        avatarUrl
                    });
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );
}

module.exports = passport;
