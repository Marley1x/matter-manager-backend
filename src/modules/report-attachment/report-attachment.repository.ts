import { Injectable } from '@nestjs/common';
import { EmailSendStatus, PdfJob, Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class ReportRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  createPdfJob(data: Prisma.PdfJobCreateInput): Promise<PdfJob> {
    return this.prismaClient.pdfJob.create({
      data,
    });
  }

  updateEmailTemplate(jobId: string, emailTemplateId: string): Promise<PdfJob> {
    return this.prismaClient.pdfJob.update({
      data: { emailTemplateId },
      where: { id: jobId },
    });
  }

  getJob(jobId: string) {
    return this.prismaClient.pdfJob.findUnique({
      where: { id: jobId },
      include: {
        emailTemplate: true,
        distributionList: {
          include: {
            distributionClientsList: {
              include: { client: true },
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  getHistory() {
    return this.prismaClient.pdfJob.findMany({
      include: {
        emailSends: { include: { client: true } },
        user: true,
        distributionList: true,
      },
      where: { emailSends: { some: {} } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  }

  getJobWithSends(id: string) {
    return this.prismaClient.pdfJob.findUnique({
      include: {
        emailSends: {
          include: { client: true },
        },
      },
      where: { id },
    });
  }

  createEmailSend(jobId: string, clientId: string, error?: string) {
    return this.prismaClient.emailSend.create({
      data: {
        pdfJob: { connect: { id: jobId } },
        client: { connect: { id: clientId } },
        status: EmailSendStatus.REQUESTED,
        error,
      },
    });
  }
  updateEmailSend(id: string, status: EmailSendStatus, error?: string) {
    return this.prismaClient.emailSend.update({
      data: { status, error },
      where: { id },
    });
  }
}
