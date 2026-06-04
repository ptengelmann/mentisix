import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module.js';
import { HealthModule } from './health/health.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { RunsModule } from './runs/runs.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DbModule.forRoot(),
    HealthModule,
    RunsModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
