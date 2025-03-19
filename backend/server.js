const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');
const dbController = require('./db/dbController');

const app = express();
const server = http.createServer(app);
// Configurer CORS pour le déploiement
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'school-management-system-dun-nu.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuration de Socket.IO avec CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'school-management-system-dun-nu.vercel.app'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/frais', fraisRoutes);


// Socket.IO configuration
require('./socket')(io);

// Use routes
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
app.use('/api/frais', fraisRoutes);
app.use('/api/admins', adminRoutes);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  try {
    // Initialiser la base de données
    await dbController.init();
    console.log(`Serveur démarré sur le port ${PORT} en mode ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
});
