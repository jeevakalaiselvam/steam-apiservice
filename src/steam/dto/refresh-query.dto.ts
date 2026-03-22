import { IsOptional, IsString } from 'class-validator';

export class RefreshQueryDto {
  @IsOptional()
  @IsString()
  steamId?: string;
}
