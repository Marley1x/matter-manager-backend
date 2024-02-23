import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateMatterStatusDto {
  @IsString()
  status: string;
}

export class UpdateMatterStatusDto {
  @IsString()
  @IsUUID()
  statusId: string;

  @IsString()
  status: string;
}

export class DeleteMatterStatusDto {
  @IsString()
  @IsUUID()
  statusId: string;
}

export class UpdateEmailOptionsDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsBoolean()
  @Transform(({ value }) => String(value) === 'true')
  secure: boolean;

  @IsBoolean()
  @Transform(({ value }) => String(value) === 'true')
  requireTLS: boolean;

  @IsNumber()
  maxConnections: number;

  @IsBoolean()
  @Transform(({ value }) => String(value) === 'true')
  tlsRejectUnauthorized: boolean;

  @IsString()
  tlsCiphers: string;

  @IsString()
  service: string;

  @IsString()
  user: string;

  @IsString()
  pass: string;
}
