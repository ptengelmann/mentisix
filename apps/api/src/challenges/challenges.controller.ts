import type { ChallengeManifest } from '@mentisix/sim';
import { Controller, Get, Header } from '@nestjs/common';
import { challengeManifests } from './registry.js';

@Controller('challenges')
export class ChallengesController {
  /**
   * Public manifest of every challenge Mentisix supports. The dojo
   * picker, methodology docs, and any external integration can read
   * this to enumerate what's available.
   */
  @Get()
  @Header('cache-control', 'public, max-age=300')
  list(): { challenges: ChallengeManifest[] } {
    return { challenges: challengeManifests() };
  }
}
