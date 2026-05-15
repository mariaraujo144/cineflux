const express = require('express');
const { jwtVerify, createRemoteJWKSet } = require('jose');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const mysql = require('mysql2/promise');

const __dirname = path.dirname(require.main.filename);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_ISSUER = 'https://accounts.google.com';
const SESSION_COOKIE = 'cineflux_session';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

const sessions = new Map();

// TiDB Connection
const dbConfig = {
  uri: process.env.DATABASE_URL || '',
};

// Parse DATABASE_URL
function parseDbUrl(url) {
  if (!url) return null;
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) return null;
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { rejectUnauthorized: true }
  };
}

const dbPool = mysql.createPool(parseDbUrl(dbConfig.uri) || {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cineflux',
  ssl: false
});

async function query(sql, params) {
  const [rows] = await dbPool.execute(sql, params);
  return rows;
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ========== AUTH ==========
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });
    const { payload } = await jwtVerify(credential, JWKS, {
      issuer: [GOOGLE_ISSUER, 'accounts.google.com'],
      audience: GOOGLE_CLIENT_ID,
      clockTolerance: 60,
    });
    if (!payload.email_verified) return res.status(400).json({ error: 'Email not verified' });
    const user = { id: payload.sub, email: payload.email, name: payload.name || payload.email.split('@')[0], picture: payload.picture || '', googleId: payload.sub };
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, user);
    res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 * 1000, path: '/' });
    return res.json({ user });
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const sessionId = req.cookies[SESSION_COOKIE];
  if (!sessionId || !sessions.has(sessionId)) return res.status(401).json({ error: 'Not authenticated' });
  return res.json({ user: sessions.get(sessionId) });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies[SESSION_COOKIE];
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie(SESSION_COOKIE);
  return res.json({ success: true });
});

// ========== BRIEFINGS ==========
// Get briefing for a job
app.get('/api/briefings/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const rows = await query('SELECT * FROM briefings WHERE job_id = ?', [jobId]);
    if (rows.length === 0) return res.json({ briefing: null });
    return res.json({ briefing: rows[0] });
  } catch (err) {
    console.error('Briefing get error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Create or update briefing
app.post('/api/briefings', async (req, res) => {
  try {
    const { job_id, objetivo, direcao_arte, direcao_fotografia, direcao_atores, elenco, trilha, narrativa, objetivos_comerciais, direcao_edicao, dados_tecnicos, consideracoes_finais, dados_legais } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id required' });

    // Check if briefing exists
    const existing = await query('SELECT id FROM briefings WHERE job_id = ?', [job_id]);

    if (existing.length > 0) {
      // Update
      await query(`
        UPDATE briefings SET 
          objetivo = ?, direcao_arte = ?, direcao_fotografia = ?, direcao_atores = ?,
          elenco = ?, trilha = ?, narrativa = ?, objetivos_comerciais = ?,
          direcao_edicao = ?, dados_tecnicos = ?, consideracoes_finais = ?, dados_legais = ?,
          updated_at = NOW()
        WHERE job_id = ?
      `, [objetivo, direcao_arte, direcao_fotografia, direcao_atores, elenco, trilha, narrativa, objetivos_comerciais, direcao_edicao, dados_tecnicos, consideracoes_finais, dados_legais, job_id]);
      return res.json({ success: true, action: 'updated' });
    } else {
      // Insert
      await query(`
        INSERT INTO briefings (job_id, objetivo, direcao_arte, direcao_fotografia, direcao_atores, elenco, trilha, narrativa, objetivos_comerciais, direcao_edicao, dados_tecnicos, consideracoes_finais, dados_legais)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [job_id, objetivo, direcao_arte, direcao_fotografia, direcao_atores, elenco, trilha, narrativa, objetivos_comerciais, direcao_edicao, dados_tecnicos, consideracoes_finais, dados_legais]);
      return res.json({ success: true, action: 'created' });
    }
  } catch (err) {
    console.error('Briefing save error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ========== JOBS (simple list) ==========
app.get('/api/jobs', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM jobs ORDER BY updated_at DESC', []);
    return res.json({ jobs: rows });
  } catch (err) {
    console.error('Jobs get error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ========== STATIC FILES ==========
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not Found' });
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, '0.0.0.0', () => {
  console.log(`CineFlux Server v2.0 running on http://localhost:${port}/`);
  console.log(`Features: Auth + Briefings + Jobs + TiDB`);
});
