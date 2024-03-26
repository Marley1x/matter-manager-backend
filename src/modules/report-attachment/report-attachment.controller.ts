// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  StreamableFile,
  ValidationPipe,
} from '@nestjs/common';

import { UpdateEmailTemplateDto } from './report-attachment.dto';
import { ReportRepository } from './report-attachment.repository';
import { PdfGenerationService } from './pdf-generator.service';
import { transformPrismaError } from 'util/transformers';
import { EmailService } from 'src/services/email.service';
import { EmailOptionsRepostory } from '../admin-options/email-options.repository';
import { EmailRepository } from '../emails/emails.repository';

@Controller('jobs')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ReportAttachmentController {
  constructor(
    private readonly pdfService: PdfGenerationService,
    private readonly reportRepository: ReportRepository,
    private readonly emailService: EmailService,
    private readonly smtpSettings: EmailOptionsRepostory,
    private readonly emailRepository: EmailRepository,
  ) {}

  @Get('/:jobId/sample')
  async getReportTest(
    @Param() { jobId }: { jobId: string },
  ): Promise<StreamableFile> {
    const job = await this.reportRepository.getJob(jobId);
    if (!job) throw new BadRequestException(`List Not Found`);

    const list = job.distributionList;
    if (!list.distributionClientsList.length)
      throw new BadRequestException(`No Clients On List Not Found`);
    const clients = list.distributionClientsList.map((l) => l.client);
    return this.pdfService.zipPdfs({ clients, date: job.date });
  }

  @Put('/:jobId/emailTemplate')
  async updateTemplate(
    @Body(new ValidationPipe({ whitelist: true }))
    updateData: UpdateEmailTemplateDto,
    @Param() { jobId }: { jobId: string },
  ): Promise<void> {
    try {
      await this.reportRepository.updateEmailTemplate(
        jobId,
        updateData.emailTemplateId,
      );
    } catch (e) {
      throw transformPrismaError(e);
    }
  }

  @Post('/:jobId/sendPdfReport')
  async send(@Param() { jobId }: { jobId: string }): Promise<void> {
    const smtpSettings = await this.smtpSettings.find();
    if (!smtpSettings || !smtpSettings.user) throw new Error('No Smtp User');

    const job = await this.reportRepository.getJob(jobId);

    if (!job) throw new Error('job not found');
    const template = job.emailTemplate;

    if (!template) throw new Error('template has not been assigned');

    const testEmail = smtpSettings.testEmail;

    try {
      for (const client of job.distributionList.distributionClientsList) {
        const attachment = await this.pdfService.generate({
          client: client.client,
          date: job.date,
        });

        const emails = (
          await this.emailRepository.findSendableByClientId(client.client.id)
        ).map((email) => email.email);

        const prefix = template.subjectPreText
          ? `${template.subjectPreText} `
          : '';

        const clientText = template.includeClientName ? client.client.name : '';

        const postfix = template.subjectPostText
          ? ` ${template.subjectPostText}`
          : '';

        await this.emailService.sendWithPdf({
          from: smtpSettings.user,
          to: testEmail ? [testEmail] : emails,
          cc: 'drew.ansbacher@gmail.com',
          html: template.body,
          attachment,
          subject: `${prefix}${clientText}${postfix}`,
        });
      }
    } catch (e) {
      throw transformPrismaError(e);
    }
  }
}

export type Document = {
  fileName: string;
};
