import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export const DB = Symbol('MENTISIX_DB');
export type Db = PostgresJsDatabase<typeof schema>;

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS DynamicModule pattern
export class DbModule {
  static forRoot(): DynamicModule {
    return {
      module: DbModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: DB,
          inject: [ConfigService],
          useFactory: (config: ConfigService): Db => {
            const url = config.get<string>('DATABASE_URL');
            if (!url) {
              throw new Error('DATABASE_URL not configured');
            }
            // Supabase requires SSL. postgres.js will negotiate it
            // when ssl: 'require' is set.
            const client = postgres(url, {
              ssl: 'require',
              max: 5,
              idle_timeout: 30,
              prepare: false,
            });
            return drizzle(client, { schema });
          },
        },
      ],
      exports: [DB],
      global: true,
    };
  }
}
