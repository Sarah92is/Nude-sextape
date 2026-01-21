const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// Chemin du fichier de stockage des utilisateurs
const dataDir = path.join(__dirname, '../data');
const usersFile = path.join(dataDir, 'users.json');
const videosDir = path.join(__dirname, '../public/videos');

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
}

// Initialiser le fichier users.json s'il n'existe pas
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Fonction pour lire les utilisateurs
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch {
        return [];
    }
}

// Fonction pour écrire les utilisateurs
function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Route d'inscription
app.post('/api/signup', (req, res) => {
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
});

// Route de connexion
app.post('/api/login', (req, res) => {
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
});

// Route pour vérifier la session
app.get('/api/check-session', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        res.json({ authenticated: true, user: decoded });
    } catch {
        res.status(401).json({ authenticated: false });
    }
});

// Route pour récupérer les vidéos
app.get('/api/videos', (req, res) => {
    try {
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
});

// Route pour servir index.html (pour les SPA)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    console.log(`📝 Code d'invitation: PreniumAcess`);
    console.log(`📺 Dossier vidéos: ${videosDir}`);
});
