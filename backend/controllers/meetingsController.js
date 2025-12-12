import db from '../config/db.js';


export const addMeeting = async (req, res) => {
try {
const { title, agenda, date, time } = req.body;
const mom_file_url = req.file ? `/uploads/${req.file.filename}` : null;
const [result] = await db.query('INSERT INTO meetings (title, agenda, date, time, mom_file_url) VALUES (?,?,?,?,?)', [title, agenda, date, time, mom_file_url]);
res.json({ message: 'Meeting scheduled', id: result.insertId });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Database error' });
}
};


export const getMeetings = async (req, res) => {
try {
const [rows] = await db.query('SELECT * FROM meetings ORDER BY date DESC');
res.json(rows);
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Database error' });
}
};