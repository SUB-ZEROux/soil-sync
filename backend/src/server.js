import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);
const dbFile = path.resolve(root, process.env.DB_FILE || './data/soil-sync.db');
const uploadDir = path.resolve(root, process.env.UPLOAD_DIR || './uploads');
const maxUploadMb = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 5));
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS crops (
    id TEXT PRIMARY KEY,
    photo_url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    description TEXT NOT NULL CHECK(length(description) BETWEEN 3 AND 1000),
    location TEXT NOT NULL CHECK(length(location) BETWEEN 2 AND 200),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    username TEXT NOT NULL CHECK(length(username) BETWEEN 1 AND 80),
    text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 500),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
    email TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('consumer','marketplace','government')),
    message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 2000),
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS comments_crop_id_idx ON comments(crop_id);
  CREATE INDEX IF NOT EXISTS crops_created_at_idx ON crops(created_at DESC);
`);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8000')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin not allowed by CORS'));
} }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('combined'));
app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false }));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype))
});
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const now = () => new Date().toISOString();
const publicCrop = (crop) => ({ ...crop, comments: db.prepare('SELECT id, username AS user, text, created_at AS createdAt FROM comments WHERE crop_id = ? ORDER BY created_at ASC').all(crop.id) });

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'soil-sync-api', time: now() }));

app.get('/api/crops', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const crops = db.prepare('SELECT id, photo_url AS photoUrl, alt_text AS altText, description, location, created_at AS createdAt FROM crops ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset).map(publicCrop);
  const total = db.prepare('SELECT COUNT(*) AS count FROM crops').get().count;
  res.json({ data: crops, pagination: { limit, offset, total } });
});

app.post('/api/crops', upload.single('photo'), (req, res) => {
  const description = clean(req.body.description, 1000);
  const location = clean(req.body.location, 200);
  if (!req.file || !description || description.length < 3 || !location || location.length < 2) {
    if (req.file) fs.rmSync(req.file.path, { force: true });
    return res.status(400).json({ error: 'A valid image, description, and location are required.' });
  }
  const id = crypto.randomUUID();
  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
  const filename = `${id}${ext}`;
  fs.renameSync(req.file.path, path.join(uploadDir, filename));
  const crop = { id, photoUrl: `/uploads/${filename}`, altText: `Crop photo from ${location}`, description, location, createdAt: now() };
  db.prepare('INSERT INTO crops (id, photo_url, alt_text, description, location, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(crop.id, crop.photoUrl, crop.altText, crop.description, crop.location, crop.createdAt);
  res.status(201).json({ data: publicCrop(crop) });
});

app.post('/api/crops/:id/comments', (req, res) => {
  const username = clean(req.body.username, 80);
  const text = clean(req.body.text, 500);
  if (!username || !text) return res.status(400).json({ error: 'Username and comment text are required.' });
  if (!db.prepare('SELECT id FROM crops WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Crop post not found.' });
  const comment = { id: crypto.randomUUID(), cropId: req.params.id, username, text, createdAt: now() };
  db.prepare('INSERT INTO comments (id, crop_id, username, text, created_at) VALUES (?, ?, ?, ?, ?)').run(comment.id, comment.cropId, comment.username, comment.text, comment.createdAt);
  res.status(201).json({ data: { id: comment.id, user: username, text, createdAt: comment.createdAt } });
});

app.post('/api/contact', (req, res) => {
  const name = clean(req.body.name, 100);
  const email = clean(req.body.email, 254).toLowerCase();
  const type = clean(req.body.type, 20);
  const message = clean(req.body.message, 2000);
  if (!name || !validEmail(email) || !['consumer', 'marketplace', 'government'].includes(type) || !message) return res.status(400).json({ error: 'Please provide a valid name, email, contact type, and message.' });
  db.prepare('INSERT INTO contact_messages (id, name, email, type, message, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(crypto.randomUUID(), name, email, type, message, now());
  res.status(201).json({ message: 'Your message was received successfully.' });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message === 'File too large') return res.status(413).json({ error: `Image must be a supported image under ${maxUploadMb}MB.` });
  if (err.message === 'Origin not allowed by CORS') return res.status(403).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(port, () => console.log(`Soil Sync API listening on port ${port}`));
