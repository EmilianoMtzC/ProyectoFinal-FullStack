const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5174').replace(/\/+$/, '');
const FRONTEND_URL_LOCAL = (process.env.FRONTEND_URL_LOCAL || 'http://localhost:5174').replace(/\/+$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
const IS_PROD = process.env.NODE_ENV === 'production';
const HAS_GOOGLE_OAUTH = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const HAS_GITHUB_OAUTH = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

const getFrontendBaseUrl = () => (IS_PROD ? FRONTEND_URL : FRONTEND_URL_LOCAL || FRONTEND_URL);

const getRedirectUrlForRole = (role) => {
    const base = getFrontendBaseUrl();
    return role === 'admin' ? `${base}/admin` : `${base}/dashboard`;
};

const getLoginUrl = () => `${getFrontendBaseUrl()}/login`;

const cookieOptions = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const allowedOrigins = Array.from(
    new Set([FRONTEND_URL, FRONTEND_URL_LOCAL].filter(Boolean))
);

module.exports = {
    FRONTEND_URL,
    FRONTEND_URL_LOCAL,
    BACKEND_URL,
    IS_PROD,
    getFrontendBaseUrl,
    getRedirectUrlForRole,
    getLoginUrl,
    cookieOptions,
    allowedOrigins,
    HAS_GOOGLE_OAUTH,
    HAS_GITHUB_OAUTH
};
