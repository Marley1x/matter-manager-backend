import { Injectable } from '@nestjs/common';

import { ReportRepository } from './report-attachment.repository';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JobDescription } from './interfaces/report-attachment.db';
import { Client, EmailSendStatus, EmailTemplate } from '@prisma/client';
import { PdfGenerationService } from './pdf-generator.service';
import { EmailOptionsRepository } from '../admin-options/email-options.repository';
import { EmailRepository } from '../emails/emails.repository';
import { EmailService } from 'src/services/email.service';

enum Events {
  CLIENT_EMAIL_REPORT_REQUESTED = 'CLIENT_EMAIL_REPORT_REQUESTED',
}

@Injectable()
export class ReportAttachmentService {
  private readonly logContext = ReportAttachmentService.name;
  constructor(
    private readonly reportRepository: ReportRepository,
    private eventEmitter: EventEmitter2,
    private readonly pdfService: PdfGenerationService,
    private readonly smtpSettings: EmailOptionsRepository,
    private readonly emailRepository: EmailRepository,
    private readonly emailService: EmailService,
  ) {}

  async startJobs(jobDescription: JobDescription): Promise<void> {
    this.eventEmitter.emit(
      Events.CLIENT_EMAIL_REPORT_REQUESTED,
      jobDescription,
    );

    return;
  }

  @OnEvent(Events.CLIENT_EMAIL_REPORT_REQUESTED)
  async onEmailReportRequested(jobDescription: JobDescription): Promise<void> {
    const smtpSettings = await this.smtpSettings.find();
    if (!smtpSettings || !smtpSettings.user) {
      throw new Error('No Smtp User');
    }

    const testEmail = smtpSettings.testEmail;

    const { emailTemplate } = jobDescription;
    let current = 0;

    const clients = jobDescription.distributionList.distributionClientsList;

    for (const client of clients) {
      const emailSend = await this.reportRepository.createEmailSend(
        jobDescription.id,
        client.clientId,
      );
      console.log(
        `[${this.logContext}]: Generating PDF for ${client.client.name} (${++current}/${clients.length})`,
      );
      let attachment: Buffer = null;
      try {
        attachment = await this.pdfService.generatePDF({
          client: client.client,
          date: jobDescription.date,
        });
        console.log(
          `[${this.logContext}]: PDF generation for ${client.client.name} SUCCESS`,
        );
        await this.reportRepository.updateEmailSend(
          emailSend.id,
          EmailSendStatus.ATTACHMENT_GENERATED,
        );
      } catch (e) {
        console.log(
          `[${this.logContext}]: PDF generation for ${client.client.name} FAILED`,
        );
        await this.reportRepository.updateEmailSend(
          emailSend.id,
          EmailSendStatus.ATTACHMENT_FAILED,
          e.message,
        );
        continue;
      }

      try {
        const emails = (
          await this.emailRepository.findSendableByClientId(client.id)
        ).map((email) => email.email);
        console.log(
          `[${this.logContext}]: Sending emails for client ${client.client.name} STARTED`,
        );
        await this.emailService.send({
          from: smtpSettings.user,
          to: testEmail ? [testEmail] : emails,
          cc: jobDescription.cc,
          html: emailTemplate.body,
          attachment,
          subject: this.getSubject(emailTemplate, client.client),
          clientName: client.client.name,
        });
        console.log(
          `[${this.logContext}]: Sending emails for client ${client.client.name} SUCCESS`,
        );
        await this.reportRepository.updateEmailSend(
          emailSend.id,
          EmailSendStatus.SENT,
        );
      } catch (e) {
        console.log(
          `[${this.logContext}]: Sending emails  for client ${client.client.name} FAILED`,
        );
        await this.reportRepository.updateEmailSend(
          emailSend.id,
          EmailSendStatus.FAILED,
          e.message,
        );
      }
    }
    console.log(
      `[${this.logContext}]: Sending emails for job ${jobDescription.id} FINISHED`,
    );
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
