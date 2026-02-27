module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_min_32_chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};
