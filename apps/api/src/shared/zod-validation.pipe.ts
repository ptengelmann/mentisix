import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Run-time request validation backed by Zod. Use as:
 *   @Body(new ZodValidationPipe(SomeSchema)) body: SomeType
 *
 * On failure, throws BadRequestException with the Zod issues attached so
 * the client gets a readable error envelope.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      error: 'validation_failed',
      issues: result.error.issues,
    });
  }
}
