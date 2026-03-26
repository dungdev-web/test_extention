import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

export interface WpMediaResult {
  id: number;
  source_url: string;
}

@Injectable()
export class WordpressService {
  private readonly logger = new Logger(WordpressService.name);

  private get wpUrl() {
    return process.env.WP_URL || 'http://localhost:8080';
  }
  private get wpUser() {
    return process.env.WP_USER || 'admin';
  }
  private get wpPass() {
    return process.env.WP_APP_PASSWORD || '';
  }

  private get authHeader() {
    const token = Buffer.from(`${this.wpUser}:${this.wpPass}`).toString(
      'base64',
    );
    return `Basic ${token}`;
  }

  async uploadFromUrl(imageUrl: string, alt?: string): Promise<WpMediaResult> {
    // 1. Fetch ảnh từ URL về buffer
      this.logger.log(`DEBUG wpUrl=${this.wpUrl} user=${this.wpUser} passLen=${this.wpPass.length}`);
    this.logger.log(`Starting upload: ${imageUrl}`);

    const response = await axios.get(imageUrl, {
  responseType: 'arraybuffer',
  timeout: 15000,
  headers: { 'User-Agent': 'ImageScanner/1.0' },
}).catch(err => {
  this.logger.error(`Fetch failed [${imageUrl}]: ${err.message}`);
  throw err;
});

    const buffer = Buffer.from(response.data);
    const contentType =
      (response.headers['content-type'] as string) || 'image/jpeg';
    const filename = this.extractFilename(imageUrl);

    // 2. Upload lên WP Media qua REST API
    const form = new FormData();
    form.append('file', buffer, { filename, contentType });
    if (alt) {
      form.append('alt_text', alt);
      form.append('title', alt);
    }

    const wpRes = await axios
      .post(`${this.wpUrl}/wp-json/wp/v2/media`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: this.authHeader,
        },
        timeout: 30000,
      })
      .catch((err) => {
        this.logger.error(
          `WP Error body: ${JSON.stringify(err.response?.data)}`,
        );
        this.logger.error(`WP Error status: ${err.response?.status}`);
        this.logger.error(`WP URL used: ${this.wpUrl}`);
        this.logger.error(`WP User: ${this.wpUser}`);
        throw err;
      });

    this.logger.log(`WP Media uploaded: ID=${wpRes.data.id}`);

    return {
      id: wpRes.data.id,
      source_url: wpRes.data.source_url,
    };
  }

  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const name = pathname.split('/').pop() || 'image.jpg';
      return name.includes('.') ? name : 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  }
}
