import { Module } from '@nestjs/common';
import { ReportAttachmentController } from './report-attachment.controller';
import { ReportRepository } from './report-attachment.repository';
import { PrismaClient } from '@prisma/client';
import { ServicesModule } from 'src/services/services.module';
import { PdfGenerationService } from './pdf-generator.service';
import { MatterModule } from '../matters/matters.module';
import { CommentsModule } from '../comments/comments.module';
import { EmailOptionsRepository } from '../admin-options/email-options.repository';
import { EmailRepository } from '../emails/emails.repository';
import { PdfModule } from '../pdf/pdf.module';
import { ReportAttachmentService } from './report-attachment.service';

@Module({
  imports: [ServicesModule, MatterModule, CommentsModule, PdfModule],
  controllers: [ReportAttachmentController],
  providers: [
    ReportRepository,
    PdfGenerationService,
    PrismaClient,
    EmailOptionsRepository,
    EmailRepository,
    ReportAttachmentService,
  ],
  exports: [ReportRepository, PdfGenerationService],
})
export class ReportAttachmentModule {}
