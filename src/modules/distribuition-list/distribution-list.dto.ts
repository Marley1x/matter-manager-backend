import { IsArray, IsString, IsUUID } from 'class-validator';

export class CreateDistributionListDto {
  @IsString()
  name: string;
}

export class UpdateListNameDto {
  @IsString()
  @IsUUID()
  distributionListId: string;

  @IsString()
  name: string;
}

export class UpdateClientListDto {
  @IsString()
  @IsUUID()
  distributionListId: string;

  @IsArray()
  clientIds: string[];
}

export class DeleteDistributionListDto {
  @IsString()
  @IsUUID()
  distributionListId: string;
}