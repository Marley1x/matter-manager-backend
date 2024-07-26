import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, SmtpConfig } from '@prisma/client';

@Injectable()
export class EmailOptionsRepostory {
  constructor(private readonly prismaClient: PrismaClient) {}

  async update(data: Prisma.SmtpConfigUpdateInput): Promise<SmtpConfig> {
    return (
      await this.prismaClient.smtpConfig.updateMany({
        data,
      })
    )[0];
  }
  find(): Promise<SmtpConfig> {
    return this.prismaClient.smtpConfig.findFirst();
  }
}
