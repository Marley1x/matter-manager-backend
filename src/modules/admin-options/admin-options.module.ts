import { Module } from '@nestjs/common';
import { AdminOptionsController } from './admin-options.controller';
import { PrismaClient } from '@prisma/client';
import { ServicesModule } from 'src/services/services.module';
import { MatterStatusRepository } from './matters-status.repository';
import { EmailOptionsRepository } from './email-options.repository';

@Module({
  imports: [ServicesModule],
  controllers: [AdminOptionsController],
  providers: [MatterStatusRepository, EmailOptionsRepository, PrismaClient],
  exports: [MatterStatusRepository, EmailOptionsRepository],
})
export class AdminOptionsModule {}
