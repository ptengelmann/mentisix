import type { ChallengeSlug, DatasetStats } from '@mentisix/types';
import { CHALLENGES } from '@mentisix/types';
import { BadRequestException, Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DatasetsRepository } from './datasets.repository.js';

function parseChallenge(raw: string): ChallengeSlug {
  if ((CHALLENGES as readonly string[]).includes(raw)) return raw as ChallengeSlug;
  throw new BadRequestException(`unknown challenge: ${raw}`);
}

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly repo: DatasetsRepository) {}

  /**
   * Stream every run for a challenge as line-delimited JSON. Public,
   * no auth, CC-BY-4.0. Researchers can pipe directly into jq, pandas,
   * etc.
   */
  @Get(':challenge/runs.jsonl')
  @Header('content-type', 'application/x-ndjson; charset=utf-8')
  @Header('content-disposition', 'inline; filename="mentisix-runs.jsonl"')
  @Header('cache-control', 'public, max-age=60')
  async runs(@Param('challenge') challengeRaw: string, @Res() res: Response): Promise<void> {
    const challenge = parseChallenge(challengeRaw);
    for await (const row of this.repo.streamRows(challenge)) {
      res.write(`${JSON.stringify(row)}\n`);
    }
    res.end();
  }

  @Get(':challenge/stats.json')
  @Header('cache-control', 'public, max-age=60')
  stats(@Param('challenge') challengeRaw: string): Promise<DatasetStats> {
    const challenge = parseChallenge(challengeRaw);
    return this.repo.stats(challenge);
  }
}
