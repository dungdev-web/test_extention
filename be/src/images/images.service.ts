import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { ImageItemDto } from './dto/upload-images.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wordpress: WordpressService,
  ) {}

  async uploadImages(images: ImageItemDto[]) {
    const results: Array<Record<string, any>> = [];
    for (const img of images) {
      // 1. Lưu MySQL — status: pending
      const record = await this.prisma.image.create({
        data: {
          url: img.url,
          width: img.width ?? null,
          height: img.height ?? null,
          alt: img.alt ?? null,
          srcType: img.srcType,
          fileType: img.fileType ?? null,
          status: 'pending',
        },
      });
      this.logger.log(`Saved #${record.id} to MySQL`);

      // 2. Upload lên WordPress
      try {
        const wp = await this.wordpress.uploadFromUrl(img.url, img.alt);

        const updated = await this.prisma.image.update({
          where: { id: record.id },
          data: {
            wpMediaId: wp.id,
            wpMediaUrl: wp.source_url,
            status: 'uploaded',
          },
        });

        this.logger.log(`Uploaded #${record.id} → WP Media ID: ${wp.id}`);
        results.push({ ...updated, success: true });
      } catch (err) {
        await this.prisma.image.update({
          where: { id: record.id },
          data: { status: 'failed' },
        });
        const errMsg = err.response?.data
          ? JSON.stringify(err.response.data)
          : err.message;
        this.logger.error(`Failed #${record.id}: ${errMsg}`);
        results.push({
          id: record.id,
          url: img.url,
          success: false,
          error: err.message,
        });
      }
    }

    return {
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async findAll() {
    return this.prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.image.findUniqueOrThrow({ where: { id } });
  }
}
