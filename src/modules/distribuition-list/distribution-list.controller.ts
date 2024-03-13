// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ValidationPipe,
} from '@nestjs/common';

import { DistributionList } from '@prisma/client';
import {
  CreateDistributionListDto,
  CreateJobDto,
  DeleteDistributionListDto,
  UpdateClientListDto,
  UpdateListNameDto,
} from './distribution-list.dto';
import { transformPrismaError } from 'util/transformers';
import { DistributionListRepository } from './distribution-list.repository';
import { ReportRepository } from '../report-attachment/report-attachment.repository';

@Controller('distribution-lists')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class DistributionListController {
  constructor(
    private readonly distributionListRepository: DistributionListRepository,
    private readonly pdfJobRepostory: ReportRepository,
  ) {}

  @Get()
  async getLists(): Promise<DistributionList[]> {
    return this.distributionListRepository.findAll();
  }

  @Post()
  async createList(
    @Body(new ValidationPipe({ whitelist: true }))
    data: CreateDistributionListDto,
  ): Promise<DistributionList> {
    let template;

    try {
      template = await this.distributionListRepository.create(data);
    } catch (e) {
      throw transformPrismaError(e);
    }
    return template;
  }

  @Put()
  async updateName(
    @Body(new ValidationPipe({ whitelist: true }))
    updateData: UpdateListNameDto,
  ): Promise<DistributionList> {
    let template;
    const { distributionListId, ...data } = updateData;
    try {
      template = await this.distributionListRepository.update(
        distributionListId,
        data,
      );
    } catch (e) {
      throw transformPrismaError(e);
    }
    return template;
  }

  @Put('list')
  async updateClientList(
    @Body(new ValidationPipe({ whitelist: true }))
    updateData: UpdateClientListDto,
  ): Promise<void> {
    try {
      await this.distributionListRepository.updateList(
        updateData.distributionListId,
        updateData.clientIds,
      );
    } catch (e) {
      throw transformPrismaError(e);
    }
  }

  @Delete()
  async deleteDistributionList(
    @Body(new ValidationPipe({ whitelist: true }))
    { distributionListId }: DeleteDistributionListDto,
  ): Promise<void> {
    try {
      await this.distributionListRepository.delete(distributionListId);
    } catch (e) {
      throw transformPrismaError(e);
    }
  }

  @Post('/:distributionListId/job')
  async createJob(
    @Param() { distributionListId }: { distributionListId: string },
    @Body(new ValidationPipe({ whitelist: true }))
    data: CreateJobDto,
  ): Promise<{ jobId: string; noMatterClients: string[] }> {
    let job;

    try {
      job = await this.pdfJobRepostory.createPdfJob({
        ...data,
        distributionList: { connect: { id: distributionListId } },
      });
    } catch (e) {
      throw transformPrismaError(e);
    }
    return { jobId: job.id, noMatterClients: [] };
  }
}
