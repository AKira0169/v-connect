import { Options, FileFilterCallback } from 'multer';
import { Request } from 'express';

export const multerOptions: Options = {
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    const allowedMimeTypes = [
      'image/jpg',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type. Only images are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
