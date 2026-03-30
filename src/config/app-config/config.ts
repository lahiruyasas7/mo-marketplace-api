import * as dotenv from 'dotenv';
dotenv.config();
export const applicationConfig = {
  port: parseInt(process.env[`APP_PORT`], 10) || 3003,
  nodeEnv: process.env[`NODE_ENV`],
  appName: process.env[`APP_NAME`],
  apiPrefix: process.env[`API_PREFIX`] || 'api',
  appFallBackLanguage: process.env[`APP_FALLBACK_LANGUAGE`] || 'en',
  appHeaderLanguage: process.env[`APP_HEADER_LANGUAGE`],
  frontendUrl: process.env[`FRONTEND_URL`],

  jwtAccessSecret: process.env[`JWT_ACCESS_SECRET`],
  jwtRefreshSecret: process.env[`JWT_REFRESH_SECRET`],
  accessTokenExpiry: process.env[`ACCESS_TOKEN_EXPIRY`] || '15m',
  refreshTokenExpiryDays:
    parseInt(process.env[`REFRESH_TOKEN_EXPIRY_DAYS`], 10) || 7,

  database: {
    host: process.env[`DB_HOST`],
    port: parseInt(process.env[`DB_PORT`], 10) | 5432,
    username: process.env[`DB_USERNAME`],
    password: process.env[`DB_PASSWORD`],
    name: process.env[`DB_NAME`],
    synchronize: process.env[`DB_SYNCHRONIZE`] === 'true',
    maxConnection: parseInt(process.env[`DB_MAX_CONNECTIONS`], 10) || 100,
    sslEnabled: process.env[`DB_SSL_ENABLED`] === 'true',
    rejectUnauthorized: process.env[`DB_REJECT_UNAUTHORIZED`] === 'true',
    nodeTlsRejectUnauthorized:
      process.env[`NODE_TLS_REJECT_UNAUTHORIZED`] === 'true',
  },
};
