import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.join(__dirname, '../public/videos');

export default function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
        }

        const files = fs.readdirSync(videosDir);
        const videos = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext);
            })
            .map(file => {
                const filePath = path.join(videosDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: `/videos/${file}`,
                    size: stats.size,
                    date: stats.birthtime
                };
            })
            .sort((a, b) => b.date - a.date);

        res.json({ videos });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des vidéos' });
    }
}
