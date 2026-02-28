

const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require("../controllers/authController");
const authMiddleware = require('../middleware/auth');
const {
    getRedirectUrlForRole,
    getLoginUrl,
    HAS_GOOGLE_OAUTH,
    HAS_GITHUB_OAUTH
} = require('../config/oauth');

require('../config/passport');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/google', (req, res, next) => {
    if (!HAS_GOOGLE_OAUTH) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get(
    '/google/callback',
    (req, res, next) => {
        if (!HAS_GOOGLE_OAUTH) {
            return res.redirect(getLoginUrl());
        }
        return next();
    },
    passport.authenticate('google', {
        session: false,
        failureRedirect: getLoginUrl()
    }),
    (req, res) => {
        const token = authController.issueTokenAndSetCookie(res, req.user);
        if (!token) {
            return res.redirect(getLoginUrl());
        }
        const redirectUrl = getRedirectUrlForRole(req.user.role);
        return res.redirect(`${redirectUrl}?token=${encodeURIComponent(token)}`);
    }
);

router.get('/github', (req, res, next) => {
    if (!HAS_GITHUB_OAUTH) {
        return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }
    return passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});
router.get(
    '/github/callback',
    (req, res, next) => {
        if (!HAS_GITHUB_OAUTH) {
            return res.redirect(getLoginUrl());
        }
        return next();
    },
    passport.authenticate('github', {
        session: false,
        failureRedirect: getLoginUrl()
    }),
    (req, res) => {
        const token = authController.issueTokenAndSetCookie(res, req.user);
        if (!token) {
            return res.redirect(getLoginUrl());
        }
        const redirectUrl = getRedirectUrlForRole(req.user.role);
        return res.redirect(`${redirectUrl}?token=${encodeURIComponent(token)}`);
    }
);

router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
