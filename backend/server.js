const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');
const dbController = require('./db/dbController');

const app = express();
const server = http.createServer(app);

// Configuration CORS unifiée pour le déploiement
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://school-management-system-dun-nu.vercel.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

// Configurer CORS une seule fois
// Configuration CORS plus permissive
app.use(cors({
  origin: '*',  // Permet toutes les origines en développement
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Pour Socket.IO
const io = socketIO(server, {
  cors: {
    origin: '*',  // Permet toutes les origines
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware JSON
app.use(express.json());

// Route de santé pour tester l'API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Création des dossiers d'upload
const uploadsDir = path.join(__dirname, 'uploads');
const directories = ['documents', 'exercices', 'soumissions'];

directories.forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configuration pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const professeurRoutes = require('./routes/professeur.routes');
const classeRoutes = require('./routes/classe.routes');
const coursRoutes = require('./routes/cours.routes');
const matiereRoutes = require('./routes/matiere.routes');
const authRoutes = require('./routes/auth.routes');
const eleveRoutes = require('./routes/eleve.routes');
const noteRoutes = require('./routes/note.routes');
const exerciceRoutes = require('./routes/exercice.routes');
const adminRoutes = require('./routes/admin.routes');
const settingsRoutes = require('./routes/settings.routes');
const messageRoutes = require('./routes/message.routes');
const parentRoutes = require('./routes/parent.routes');
const fraisRoutes = require('./routes/frais.routes');
//const databaseRoutes = require('./routes/database.routes');

// Configuration Socket.IO
require('./socket')(io);

// Utilisation des routes
app.use('/api/professeurs', professeurRoutes);
app.use('/api/classes', classeRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/eleves', eleveRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/exercices', exerciceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/frais', fraisRoutes);
app.use('/api/admins', adminRoutes);
//app.use('/api/database', databaseRoutes);

// Middleware de validation JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'JSON invalide' });
  }
  next(err);
});

// Gestion des erreurs avec plus de détails
app.use((err, req, res, next) => {
  console.error('Erreur détaillée:', err);
  res.status(500).json({
    message: 'Une erreur est survenue',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Gestionnaire pour toutes les autres routes inconnues
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
  try {
    // Initialiser la base de données
    await dbController.init();
    await dbController.migrateSpecificCollection('cours');
    console.log(`Serveur démarré sur le port ${PORT} en mode ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
});
