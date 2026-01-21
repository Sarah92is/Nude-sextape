import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.join(__dirname, '../public/videos');

export default function handler(req, res) {
    // CORS et headers pour vidéos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    res.setHeader('Accept-Ranges', 'bytes');

    if (req.method === 'OPTIONS' || req.method === 'HEAD') {
        res.status(200).end();
        return;
    }

    try {
        // Décoder le chemin correctement
        let fileName = req.query.file || req.url.split('/').pop();
        fileName = decodeURIComponent(fileName);
        
        console.log('Fichier demandé:', fileName);
        const filePath = path.join(videosDir, fileName);

        // Vérification de sécurité
        if (!filePath.startsWith(videosDir)) {
            console.error('Accès refusé:', filePath);
            return res.status(403).json({ error: 'Accès refusé' });
        }

        if (!fs.existsSync(filePath)) {
            console.error('Fichier non trouvé:', filePath);
            return res.status(404).json({ error: 'Vidéo non trouvée' });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        // Range request support
        if (req.headers.range) {
            const parts = req.headers.range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Content-Length': (end - start) + 1,
                'Content-Type': 'video/mp4'
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
}
