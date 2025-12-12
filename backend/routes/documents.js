import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { addDocument, getDocuments } from '../controllers/documentsController.js';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });


router.get('/', getDocuments);
router.post('/', upload.single('file'), addDocument);


export default router;