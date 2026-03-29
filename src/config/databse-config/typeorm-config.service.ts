import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',

      host: this.configService.get<string>('app.databaseHost'),
      port: this.configService.get<number>('app.databasePort'),
      username: this.configService.get<string>('app.databaseUserName'),
      password: this.configService.get<string>('app.databasePassword'),
      database: this.configService.get<string>('app.databaseName'),

      autoLoadEntities: true,

      synchronize: false, //NEVER TRUE in production
      dropSchema: false,

      logging: this.configService.get('app.nodeEnv') !== 'production',

      ssl: this.configService.get('app.databaseSslEnabled')
        ? {
            rejectUnauthorized: this.configService.get(
              'app.databaseRejectUnauthorized',
            ),
          }
        : false,

      extra: {
        max: this.configService.get<number>('app.databaseMaxConnection'),
      },

      migrations: ['dist/config/database/migrations/*.js'],
    };
  }
}
