import { Type } from 'class-transformer'
import {
  IsArray, IsInt, IsOptional,
  IsString, Min, ValidateNested,
} from 'class-validator'

export class ImageItemDto {
  @IsString()
  url: string

  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number

  @IsOptional()
  @IsString()
  alt?: string

  @IsString()
  srcType: string // 'IMG' | 'CSS BG' | 'SOURCE'

  @IsOptional()
  @IsString()
  fileType?: string // 'JPEG' | 'PNG' | 'SVG'
}

export class UploadImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageItemDto)
  images: ImageItemDto[]
}