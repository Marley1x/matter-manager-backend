import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { UserModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { ServicesModule } from './services/services.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './middleware/auth.guard';
import { ClientModule } from './modules/clients/clients.module';
import { EmailModule } from './modules/emails/emails.module';
import { MatterModule } from './modules/matters/matters.module';
import { AdminOptionsModule } from './modules/admin-options/admin-options.module';
import { InternalNotesModule } from './modules/internal-notes/internal-notes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { EmailTemplateModule } from './modules/email-templates/email-template.module';
import { ReportAttachmentModule } from './modules/report-attachment/report-attachment.module';
import { DistributionListModule } from './modules/distribuition-list/distribution-list.module';

@Module({
  imports: [
    HealthCheckModule,
    UserModule,
    ClientModule,
    EmailModule,
    MatterModule,
    AdminOptionsModule,
    InternalNotesModule,
    CommentsModule,
    EmailTemplateModule,
    DistributionListModule,
    ReportAttachmentModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend/browser'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaClient,
    ServicesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
