import { registerAs } from '@nestjs/config';
import { applicationConfig } from './config';

export default registerAs('app', () => ({
  // General Config
  nodeEnv: applicationConfig.nodeEnv,
  name: applicationConfig.appName,
  port: applicationConfig.port,
  apiPrefix: applicationConfig.apiPrefix,
  fallbackLanguage: applicationConfig.appFallBackLanguage,
  frontendUrl: applicationConfig.frontendUrl,

  jwtAccessSecret: applicationConfig.jwtAccessSecret,
  jwtRefreshSecret: applicationConfig.jwtRefreshSecret,
  accessTokenExpiry: applicationConfig.accessTokenExpiry,
  refreshTokenExpiryDays: applicationConfig.refreshTokenExpiryDays,

  // Database Config
  databaseType: 'postgres',
  databaseHost: applicationConfig.database.host,
  databasePort: applicationConfig.database.port,
  databasePassword: applicationConfig.database.password,
  databaseName: applicationConfig.database.name,
  databaseUserName: applicationConfig.database.username,
  databaseSynchronize: applicationConfig.database.synchronize,
  databaseMaxConnection: applicationConfig.database.maxConnection,
  databaseSslEnabled: applicationConfig.database.sslEnabled,
  databaseRejectUnauthorized: applicationConfig.database.rejectUnauthorized,
}));
