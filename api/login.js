import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersFile = path.join(__dirname, '../.data/users.json');

function getUsers() {
    try {
        const dir = path.dirname(usersFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(usersFile)) {
            return [];
        }
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch {
        return [];
    }
}

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

    if (req.method === 'POST') {
        const { email, password } = req.body;

        let users = getUsers();
        const user = users.find(u => 
            u.email === email.trim() && 
            u.password === Buffer.from(password).toString('base64')
        );

        if (!user) {
            return res.status(401).json({ error: '❌ Email ou mot de passe incorrect.' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
            message: '✨ Connexion réussie !',
            user: userWithoutPassword 
        });
    }
}
