const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Chemin du fichier de stockage des utilisateurs
const usersFile = path.join(__dirname, 'users.json');
const videosDir = path.join(__dirname, 'videos');

// Initialiser le fichier users.json s'il n'existe pas
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Créer le dossier videos s'il n'existe pas
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir);
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
        password: Buffer.from(password).toString('base64'), // Encodage simple
        createdAt: new Date().toLocaleDateString('fr-FR')
    };

    users.push(newUser);
    saveUsers(users);

    // Retourner l'utilisateur sans le mot de passe
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

    // Retourner l'utilisateur sans le mot de passe
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
                    path: `videos/${file}`,
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

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    console.log(`📝 Code d'invitation: PreniumAcess`);
    console.log(`📺 Dossier vidéos: ${videosDir}`);
    console.log(`💡 Déposez vos vidéos dans le dossier: videos/`);
});
