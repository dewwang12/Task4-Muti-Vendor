import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.resolve(
      this.configService.get<string>('storage.localDir') || './uploads',
    );
    this.apiUrl = this.configService.get<string>('apiUrl') || 'http://localhost:4000';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WEBP, and GIF are permitted.');
    }

    // 5MB limit
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File size exceeds the 5MB limit');
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const key = `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(this.uploadDir, key);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: `${this.apiUrl}/uploads/${key}`,
      key,
    };
  }
}
