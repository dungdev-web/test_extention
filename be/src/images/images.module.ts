import { Module } from '@nestjs/common'
import { ImagesController } from './images.controller'
import { ImagesService } from './images.service'
import { WordpressModule } from '../wordpress/wordpress.module'

@Module({
  imports: [WordpressModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}