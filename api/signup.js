import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersFile = path.join(__dirname, '../.data/users.json');

// Créer le dossier .data s'il n'existe pas
function ensureDir() {
    const dir = path.dirname(usersFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getUsers() {
    try {
        ensureDir();
        if (!fs.existsSync(usersFile)) {
            fs.writeFileSync(usersFile, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    try {
        ensureDir();
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
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
        const { firstName, lastName, email, password, confirmPassword, invitationCode } = req.body;

        // Validation du code d'invitation
        if (invitationCode !== 'PreniumAcess') {
            return res.status(400).json({ error: '❌ Code d\'invitation invalide.' });
        }

        // Validation des mots de passe
        if (password !== confirmPassword) {
            return res.status(400).json({ error: '❌ Les mots de passe ne correspondent pas.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: '❌ Le mot de passe doit contenir au moins 6 caractères.' });
        }

        // Vérifier si l'email existe déjà
        let users = getUsers();
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ error: '❌ Cet email est déjà utilisé.' });
        }

        // Créer le nouvel utilisateur
        const newUser = {
            id: Date.now(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password: Buffer.from(password).toString('base64'),
            createdAt: new Date().toLocaleDateString('fr-FR')
        };

        users.push(newUser);
        saveUsers(users);

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
            message: '✨ Compte créé avec succès !',
            user: userWithoutPassword 
        });
    }
}
