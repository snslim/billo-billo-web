import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

function createUpload(allowedTypes: string[]) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('지원하지 않는 파일 형식입니다'));
      }
    },
  });
}

export const upload = createUpload(DOCUMENT_MIME_TYPES);
export const imageUpload = createUpload(IMAGE_MIME_TYPES);
