import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// Routes API
app.post('/api/signup', async (req, res) => {
    const signup = await import('./signup.js');
    signup.default(req, res);
});

app.post('/api/login', async (req, res) => {
    const login = await import('./login.js');
    login.default(req, res);
});

app.get('/api/videos', async (req, res) => {
    const videos = await import('./videos.js');
    videos.default(req, res);
});

// Servir index.html pour les routes SPA
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur local lancé sur le port ${PORT}`);
    console.log(`📝 Code d'invitation: PreniumAcess`);
});
