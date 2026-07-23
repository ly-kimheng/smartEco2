import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG and WEBP images are allowed'));
  }
};

// Builds a multer instance that saves into BackEnd/src/uploads/<subfolder>.
// Used so different features (reports, rewards, guides, ...) keep their
// uploaded images in their own folder without duplicating this whole file.
export function createUploader(subfolder) {
  const destDir = path.join(__dirname, '../uploads', subfolder);
  fs.mkdirSync(destDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  });
}

// Existing default export — unchanged behavior for every route already
// using `upload.single(...)` against the reports folder.
const upload = createUploader('reports');

export default upload;