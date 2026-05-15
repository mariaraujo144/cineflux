const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['https://cineflux.app', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadDir = path.join(__dirname, 'uploads', 'roteiros');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ROTAS EXISTENTES
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/bypass-login', (req, res) => {
    const email = req.query.email || 'mariaraujo29@gmail.com';
    const user = { token: 'bypass', email, name: 'Mari Araujo', picture: null, bypass: true };
    res.cookie('session', JSON.stringify(user), { httpOnly: true, secure: true, sameSite: 'lax' });
    res.redirect('/dashboard.html');
});

app.get('/api/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://cineflux.app/api/auth/google/callback';
    const scope = 'openid email profile';
    const state = Math.random().toString(36).substring(7);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Código não fornecido' });
    try {
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://cineflux.app/api/auth/google/callback';
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });
        const tokens = await tokenResponse.json();
        if (tokens.error) {
            console.error('OAuth token error:', tokens);
            return res.status(400).send(`Erro OAuth: ${tokens.error_description || tokens.error}`);
        }
        const idToken = tokens.id_token;
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());
        const sessionData = {
            token: idToken,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };
        res.cookie('session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.redirect('/dashboard.html');
    } catch (error) {
        console.error('Erro no callback OAuth:', error);
        res.status(500).send(`Erro na autenticação: ${error.message}`);
    }
});

app.get('/api/auth/me', (req, res) => {
    const session = req.cookies.session;
    if (!session) return res.status(401).json({ error: 'Não autenticado' });
    try {
        const user = JSON.parse(session);
        res.json({
            id: user.email,
            name: user.name,
            email: user.email,
            picture: user.picture,
            bypass: user.bypass || false
        });
    } catch (e) {
        res.clearCookie('session');
        res.status(401).json({ error: 'Sessão inválida' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('session');
    res.json({ success: true });
});

app.post('/api/scriptor/decupar', upload.single('roteiro'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    res.json({ success: true, message: 'Roteiro recebido', file: req.file.filename });
});

app.get('/api/scriptor/roteiros', (req, res) => {
    const files = fs.readdirSync(uploadDir).map(f => ({ name: f, url: `/uploads/roteiros/${f}` }));
    res.json({ files });
});

app.delete('/api/scriptor/roteiros/:file', (req, res) => {
    const filePath = path.join(uploadDir, req.params.file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Arquivo não encontrado' });
    }
});

// ============================================
// VITRINE - IMPORTAÇÃO DO GOOGLE DRIVE
// ============================================

const GOOGLE_SERVICE_ACCOUNT_PATH = path.join(__dirname, '.config', 'google-service-account.json');

function getGoogleAuth() {
    const credentials = JSON.parse(fs.readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8'));
    return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
}

function extractFolderId(url) {
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

app.get('/api/vitrine/drive-status', (req, res) => {
    const hasCredentials = fs.existsSync(GOOGLE_SERVICE_ACCOUNT_PATH);
    res.json({ configured: hasCredentials, message: hasCredentials ? 'Google Drive integrado' : 'Credenciais não configuradas' });
});

app.post('/api/vitrine/import-drive', async (req, res) => {
    try {
        const { folderUrl, category } = req.body || {};
        if (!folderUrl) return res.status(400).json({ error: 'folderUrl é obrigatório' });
        const folderId = extractFolderId(folderUrl);
        if (!folderId) return res.status(400).json({ error: 'URL inválida. Use: https://drive.google.com/drive/folders/ID' });

        const auth = getGoogleAuth();
        const drive = google.drive({ version: 'v3', auth });

        const folders = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)'
        });

        const locations = [];
        for (const folder of folders.data.files || []) {
            const photos = await drive.files.list({
                q: `mimeType contains 'image/' and '${folder.id}' in parents and trashed=false`,
                fields: 'files(id, name, mimeType)'
            });

            locations.push({
                name: folder.name,
                driveFolderId: folder.id,
                category: category || 'casa',
                photos: (photos.data.files || []).map(f => ({
                    id: f.id,
                    name: f.name,
                    directUrl: `https://lh3.googleusercontent.com/d/${f.id}`
                })),
                photoCount: (photos.data.files || []).length
            });
        }

        res.json({ success: true, locations, totalLocations: locations.length });
    } catch (error) {
        console.error('Erro ao importar Drive:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vitrine/photo/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const auth = getGoogleAuth();
        const drive = google.drive({ version: 'v3', auth });

        const fileMeta = await drive.files.get({ fileId, fields: 'name, mimeType' });
        const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

        res.setHeader('Content-Type', fileMeta.data.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileMeta.data.name}"`);
        response.data.pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao baixar foto' });
    }
});

console.log('✅ Vitrine backend carregado');

// START SERVER
app.listen(PORT, () => console.log(`CineFlux API running on http://localhost:${PORT}/`));
