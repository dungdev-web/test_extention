import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { WordpressModule } from './wordpress/wordpress.module'
import { ImagesModule } from './images/images.module'

@Module({
  imports: [PrismaModule, WordpressModule, ImagesModule],
})
export class AppModule {}