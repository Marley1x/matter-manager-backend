import { Module } from '@nestjs/common';
import { DistributionListController } from './distribution-list.controller';
import { DistributionListRepository } from './distribution-list.repository';
import { PrismaClient } from '@prisma/client';
import { ServicesModule } from 'src/services/services.module';
import { ReportAttachmentModule } from '../report-attachment/report-attachment.module';

@Module({
  imports: [ServicesModule, ReportAttachmentModule],
  controllers: [DistributionListController],
  providers: [DistributionListRepository, PrismaClient],
  exports: [DistributionListRepository],
})
export class DistributionListModule {}
