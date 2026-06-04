import type { ChallengeSlug, LeaderboardRow } from '@mentisix/types';
import { CHALLENGES } from '@mentisix/types';
import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { LeaderboardRepository } from './leaderboard.repository.js';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly repo: LeaderboardRepository) {}

  @Get(':challenge')
  async top(@Param('challenge') challenge: string): Promise<LeaderboardRow[]> {
    if (!CHALLENGES.includes(challenge as ChallengeSlug)) {
      throw new BadRequestException(`unknown challenge: ${challenge}`);
    }
    return this.repo.top(challenge as ChallengeSlug);
  }
}
