import { FileTypeConfig } from '../models/file-type-config';

export const fileTypeConfig: FileTypeConfig[] = [
  { extension: '.pdf', mimeType: 'application/pdf' },
  { extension: '.doc', mimeType: 'application/msword' },
  {
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  { extension: '.jpg', mimeType: 'image/jpeg' },
  { extension: '.png', mimeType: 'image/png' },
];
