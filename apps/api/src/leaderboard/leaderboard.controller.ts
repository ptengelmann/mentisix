import type { Difficulty } from '@mentisix/sim';
import type { ChallengeSlug, LeaderboardRow } from '@mentisix/types';
import { CHALLENGES, DIFFICULTIES } from '@mentisix/types';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardRepository } from './leaderboard.repository.js';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly repo: LeaderboardRepository) {}

  @Get(':challenge')
  async top(
    @Param('challenge') challenge: string,
    @Query('difficulty') difficultyRaw?: string,
  ): Promise<LeaderboardRow[]> {
    if (!CHALLENGES.includes(challenge as ChallengeSlug)) {
      throw new BadRequestException(`unknown challenge: ${challenge}`);
    }
    const difficulty: Difficulty =
      difficultyRaw && (DIFFICULTIES as readonly string[]).includes(difficultyRaw)
        ? (difficultyRaw as Difficulty)
        : 'medium';
    return this.repo.top(challenge as ChallengeSlug, difficulty);
  }
}
