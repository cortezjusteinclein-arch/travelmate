// TravelMate server (Postgres version). Works on any device / network once deployed.
// Required env vars:  DATABASE_URL  (Postgres connection string)
// Optional:           ADMIN_PASSWORD (first-run admin password), PORT
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
if (!process.env.DATABASE_URL) { console.error('Missing DATABASE_URL environment variable.'); process.exit(1); }
const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });
const q = (text, params) => pool.query(text, params).then(r => r.rows);

const app = express();
app.use(express.json({ limit: '1mb' }));
const wrap = fn => (req, res, next) => fn(req, res, next).catch(e => { console.error(e); res.status(500).json({ error: 'Server error.' }); });

function hashPw(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function checkPw(pw, stored) {
  const [salt, h] = stored.split(':');
  const t = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(t, 'hex'));
}

const USER_COLS = `('U'||lpad(n::text,4,'0')) AS id, first, last, display, email, role, registered`;
const BOOK_COLS = `('B'||lpad(n::text,4,'0')) AS id, ('U'||lpad(user_n::text,4,'0')) AS "userId", name, kind, loc, a, b, g, total::float8 AS total, status, created`;

async function init() {
  await q(`CREATE TABLE IF NOT EXISTS users(
    n SERIAL PRIMARY KEY, first TEXT, last TEXT, display TEXT, email TEXT UNIQUE, pw TEXT,
    role TEXT DEFAULT 'Traveler', registered TIMESTAMPTZ DEFAULT now())`);
  await q(`CREATE UNIQUE INDEX IF NOT EXISTS users_display_ci ON users (lower(display))`);
  await q(`CREATE TABLE IF NOT EXISTS bookings(
    n SERIAL PRIMARY KEY, user_n INT REFERENCES users(n), name TEXT, kind TEXT, loc TEXT,
    a TEXT, b TEXT, g INT, total NUMERIC, status TEXT, created TIMESTAMPTZ DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_n INT REFERENCES users(n), created TIMESTAMPTZ DEFAULT now())`);
  const admin = await q(`SELECT 1 FROM users WHERE role='Administrator' LIMIT 1`);
  if (!admin.length) {
    await q(`INSERT INTO users(first,last,display,email,pw,role) VALUES('Admin','User','admin','admin@travelmate.ph',$1,'Administrator')`,
      [hashPw(process.env.ADMIN_PASSWORD || 'admin123')]);
    console.log('Created admin account admin@travelmate.ph');
  }
}

async function startSession(userN) {
  const t = crypto.randomBytes(24).toString('hex');
  await q(`INSERT INTO sessions(token,user_n) VALUES($1,$2)`, [t, userN]);
  return t;
}
const auth = wrap(async (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  const rows = t ? await q(`SELECT u.n, ${USER_COLS}, u.role FROM sessions s JOIN users u ON u.n=s.user_n WHERE s.token=$1`, [t]) : [];
  if (!rows.length) return res.status(401).json({ error: 'Please log in.' });
  req.user = rows[0]; next();
});
const adminOnly = (req, res, next) => req.user.role === 'Administrator' ? next() : res.status(403).json({ error: 'Administrators only.' });

app.post('/api/register', wrap(async (req, res) => {
  const { first, last, display, email, password } = req.body || {};
  const em = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(em)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!first || !last) return res.status(400).json({ error: 'Enter your first and last name.' });
  if (!/^[\w.]{3,20}$/.test(display || '')) return res.status(400).json({ error: 'Display name: 3–20 letters, numbers, _ or .' });
  if (!password || password.length < 8 || !/\d/.test(password)) return res.status(400).json({ error: 'Password needs 8+ characters and a number.' });
  if ((await q(`SELECT 1 FROM users WHERE email=$1`, [em])).length) return res.status(409).json({ error: 'That email is already registered. Try logging in.' });
  if ((await q(`SELECT 1 FROM users WHERE lower(display)=lower($1)`, [display])).length) return res.status(409).json({ error: 'That display name is taken.' });
  const [u] = await q(`INSERT INTO users(first,last,display,email,pw) VALUES($1,$2,$3,$4,$5) RETURNING n, ${USER_COLS}`,
    [first.trim(), last.trim(), display, em, hashPw(password)]);
  res.json({ token: await startSession(u.n), user: { ...u, n: undefined } });
}));

app.post('/api/login', wrap(async (req, res) => {
  const em = String((req.body || {}).email || '').trim().toLowerCase();
  const [u] = await q(`SELECT n, pw, ${USER_COLS} FROM users WHERE email=$1`, [em]);
  if (!u || !checkPw(String(req.body.password || ''), u.pw)) return res.status(401).json({ error: 'Incorrect email or password.' });
  res.json({ token: await startSession(u.n), user: { ...u, n: undefined, pw: undefined } });
}));

app.get('/api/me', auth, (req, res) => res.json({ ...req.user, n: undefined }));

app.post('/api/bookings', auth, wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.kind) return res.status(400).json({ error: 'Missing booking details.' });
  const [row] = await q(`INSERT INTO bookings(user_n,name,kind,loc,a,b,g,total,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${BOOK_COLS}`,
    [req.user.n, String(b.name), String(b.kind), b.loc || '', b.a || '', b.b || '', Number(b.g) || 1, Number(b.total) || 0, b.status || 'Confirmed']);
  res.json(row);
}));
app.get('/api/bookings', auth, wrap(async (req, res) =>
  res.json(await q(`SELECT ${BOOK_COLS} FROM bookings WHERE user_n=$1 ORDER BY n`, [req.user.n]))));
app.patch('/api/bookings/:id', auth, wrap(async (req, res) => {
  const n = parseInt(req.params.id.replace(/\D/g, ''), 10);
  if (!['Cancelled', 'Completed'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status.' });
  const rows = await q(`UPDATE bookings SET status=$1 WHERE n=$2 AND user_n=$3 RETURNING ${BOOK_COLS}`, [req.body.status, n, req.user.n]);
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: 'Not found.' });
}));

app.get('/api/admin/users', auth, adminOnly, wrap(async (req, res) =>
  res.json(await q(`SELECT ${USER_COLS} FROM users ORDER BY n`))));
app.get('/api/admin/bookings', auth, adminOnly, wrap(async (req, res) =>
  res.json(await q(`SELECT ('B'||lpad(b.n::text,4,'0')) AS id, ('U'||lpad(b.user_n::text,4,'0')) AS "userId", b.name, b.kind, b.loc, b.a, b.b, b.g, b.total::float8 AS total, b.status, b.created,
    u.display AS traveler, u.email FROM bookings b LEFT JOIN users u ON u.n=b.user_n ORDER BY b.n`))));
app.patch('/api/admin/bookings/:id', auth, adminOnly, wrap(async (req, res) => {
  const n = parseInt(req.params.id.replace(/\D/g, ''), 10);
  const rows = await q(`UPDATE bookings SET status=$1 WHERE n=$2 RETURNING ${BOOK_COLS}`, [String(req.body.status || ''), n]);
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: 'Not found.' });
}));
app.patch('/api/admin/users/:id', auth, adminOnly, wrap(async (req, res) => {
  const n = parseInt(req.params.id.replace(/\D/g, ''), 10);
  if (!['Traveler', 'Host', 'Administrator'].includes(req.body.role)) return res.status(400).json({ error: 'Invalid role.' });
  const rows = await q(`UPDATE users SET role=$1 WHERE n=$2 RETURNING ${USER_COLS}`, [req.body.role, n]);
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: 'Not found.' });
}));

app.get('/healthz', (req, res) => res.send('ok'));
app.use(express.static(path.join(__dirname, 'public')));

init().then(() => app.listen(PORT, () => console.log('TravelMate running on port ' + PORT)))
  .catch(e => { console.error('Database setup failed:', e.message); process.exit(1); });