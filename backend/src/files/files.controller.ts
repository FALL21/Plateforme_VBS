import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as fs from 'fs';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  @Post('upload')
  @ApiOperation({ summary: 'Uploader un fichier (logo prestataire)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'backend', 'uploads');
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname || 'file'));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Seules les images sont autorisées') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Aucun fichier');
    }
    // URL publique de consultation
    const url = `/api/files/${file.filename}`;
    return { filename: file.filename, url };
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Servir un fichier uploadé' })
  serve(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'backend', 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Not found');
    }
    return res.sendFile(filePath);
  }
}


