import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController, JobsController } from './companies.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [CompaniesController, JobsController],
  providers: [CompaniesService, PrismaService],
  exports: [CompaniesService],
})
export class CompaniesModule {}