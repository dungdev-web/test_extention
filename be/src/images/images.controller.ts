import {
  Body, Controller, Get, HttpCode,
  HttpStatus, Param, ParseIntPipe, Post,
} from '@nestjs/common'
import { ImagesService } from './images.service'
import { UploadImagesDto } from './dto/upload-images.dto'

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // POST /images/upload
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  upload(@Body() dto: UploadImagesDto) {
    return this.imagesService.uploadImages(dto.images)
  }

  // GET /images
  @Get()
  findAll() {
    return this.imagesService.findAll()
  }

  // GET /images/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.findOne(id)
  }
}