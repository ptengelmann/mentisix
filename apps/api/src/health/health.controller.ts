import { Controller, Get } from '@nestjs/common';

export type HealthResponse = {
  status: 'ok';
  service: 'mentisix-api';
  version: string;
  uptimeMs: number;
  startedAt: string;
};

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();
  private readonly version = process.env.npm_package_version ?? '0.0.0';

  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'mentisix-api',
      version: this.version,
      uptimeMs: Date.now() - this.startedAt,
      startedAt: new Date(this.startedAt).toISOString(),
    };
  }
}
