import db from '../config/db.js';
import path from 'path';


export const addDocument = async (req, res) => {
try {
if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
const title = req.body.title || req.file.originalname;
const file_url = `/uploads/${req.file.filename}`;
const upload_date = new Date();
const uploaded_by = req.body.uploaded_by || 'admin';
const [result] = await db.query('INSERT INTO documents (title, file_url, upload_date, uploaded_by) VALUES (?,?,?,?)', [title, file_url, upload_date, uploaded_by]);
res.json({ message: 'Document uploaded', id: result.insertId, file_url });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Upload error' });
}
};


export const getDocuments = async (req, res) => {
try {
const [rows] = await db.query('SELECT * FROM documents ORDER BY upload_date DESC');
res.json(rows);
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Database error' });
}
};