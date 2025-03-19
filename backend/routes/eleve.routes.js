// routes/eleve.routes.js
const express = require('express');
const router = express.Router();
const EleveController = require('../controllers/EleveController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes avec authentification
router.get('/', authMiddleware.filterParProfesseur, EleveController.getAllEleves);
router.get('/classe/:classeId', authMiddleware.canAccessClasse, EleveController.getElevesByClasse);
router.get('/:id', authMiddleware.filterParProfesseur, EleveController.getEleveById);
// Ajoutez ces routes à votre fichier eleve.routes.js
router.post('/', authMiddleware.isAdmin, EleveController.createEleve);
router.put('/:id', authMiddleware.isAdmin, EleveController.updateEleve);
router.delete('/:id', authMiddleware.isAdmin, EleveController.deleteEleve);
module.exports = router;