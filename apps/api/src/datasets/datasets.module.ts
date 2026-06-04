import { Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller.js';
import { DatasetsRepository } from './datasets.repository.js';

@Module({
  controllers: [DatasetsController],
  providers: [DatasetsRepository],
})
export class DatasetsModule {}
