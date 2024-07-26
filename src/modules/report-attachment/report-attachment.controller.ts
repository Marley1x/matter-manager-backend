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
import {
  Client,
  DistributionList,
  DistributionListClient,
  EmailTemplate,
  JobType,
  PdfJob,
} from '@prisma/client';

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

  @Get('history')
  async getHistory(): Promise<PdfJob[]> {
    return this.reportRepository.getHistory();
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

  @Post('/:jobId/send')
  async send(@Param() { jobId }: { jobId: string }): Promise<PdfJob> {
    const job = await this.reportRepository.getJob(jobId);
    if (!job) throw new Error('job not found');

    if (job.type === JobType.REPORT_EMAIL) {
      await this.sendReport(job);
    } else if (job.type === JobType.NO_REPORT_EMAIL) {
      await this.sendEmailOnly(job);
    }

    return this.reportRepository.getJobWithSends(jobId);
  }

  async sendReport(
    job: PdfJob & {
      emailTemplate: EmailTemplate;
      distributionList: DistributionList & {
        distributionClientsList: (DistributionListClient & {
          client: Client;
        })[];
      };
    },
  ): Promise<void> {
    const smtpSettings = await this.smtpSettings.find();
    if (!smtpSettings || !smtpSettings.user) throw new Error('No Smtp User');

    const template = job.emailTemplate;

    if (!template) throw new Error('template has not been assigned');

    const testEmail = smtpSettings.testEmail;

    for (const client of job.distributionList.distributionClientsList) {
      try {
        const attachment = await this.pdfService.generatePDF({
          client: client.client,
          date: job.date,
        });

        const emails = (
          await this.emailRepository.findSendableByClientId(client.client.id)
        ).map((email) => email.email);

        await this.emailService.send({
          from: smtpSettings.user,
          to: testEmail ? [testEmail] : emails,
          cc: job.cc,
          html: template.body,
          attachment,
          subject: this.getSubject(template, client.client),
          clientName: client.client.name,
        });
        await this.reportRepository.createEmailSend(job.id, client.clientId);
      } catch (e) {
        await this.reportRepository.createEmailSend(
          job.id,
          client.clientId,
          e.message,
        );
      }
    }
  }

  async sendEmailOnly(
    job: PdfJob & {
      emailTemplate: EmailTemplate;
      distributionList: DistributionList & {
        distributionClientsList: (DistributionListClient & {
          client: Client;
        })[];
      };
    },
  ): Promise<void> {
    const smtpSettings = await this.smtpSettings.find();
    if (!smtpSettings || !smtpSettings.user) throw new Error('No Smtp User');

    const template = job.emailTemplate;

    if (!template) throw new Error('template has not been assigned');

    const testEmail = smtpSettings.testEmail;

    for (const client of job.distributionList.distributionClientsList) {
      try {
        const emails = (
          await this.emailRepository.findSendableByClientId(client.client.id)
        ).map((email) => email.email);

        await this.emailService.send({
          from: smtpSettings.user,
          to: testEmail ? [testEmail] : emails,
          cc: job.cc,
          html: template.body,
          subject: this.getSubject(template, client.client),
          clientName: client.client.name,
        });

        await this.reportRepository.createEmailSend(job.id, client.clientId);
      } catch (e: any) {
        await this.reportRepository.createEmailSend(
          job.id,
          client.clientId,
          e.message,
        );
      }
    }
  }

  getSubject(template: EmailTemplate, client: Client): string {
    const prefix = template.subjectPreText ? `${template.subjectPreText} ` : '';

    const clientText = template.includeClientName ? client.name : '';

    const postfix = template.subjectPostText
      ? ` ${template.subjectPostText}`
      : '';

    return `${prefix}${clientText}${postfix}`;
  }
}

export type Document = {
  fileName: string;
};
