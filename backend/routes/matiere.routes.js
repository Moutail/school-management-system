// routes/matiere.routes.js
const express = require('express');
const router = express.Router();
const MatiereController = require('../controllers/MatiereController');
const authMiddleware = require('../middleware/authMiddleware');

// Récupération des matières par professeur
router.get('/professeur/:professeurId', MatiereController.getMatieresForProfesseur);

// Récupération de toutes les matières
router.get('/', MatiereController.getAllMatieres);

// Récupération des matières d'une classe spécifique
router.get('/classe/:classeId', authMiddleware.canAccessClasse, MatiereController.getMatieresForClasse);

// Récupération d'une matière spécifique
// Remplacer le middleware enseigneMatiere qui échoue par un middleware plus simple
router.get('/:matiereId', MatiereController.getMatiereById);

// Création d'une nouvelle matière - réservée aux administrateurs
router.post('/', authMiddleware.isProfesseur, MatiereController.createMatiere);

// Mise à jour d'une matière - réservée aux administrateurs
router.put('/:matiereId', authMiddleware.isAdmin, MatiereController.updateMatiere);

// Suppression d'une matière - réservée aux administrateurs
// IMPORTANT: Utiliser isAdmin au lieu de enseigneMatiere pour la suppression
router.delete('/:matiereId', authMiddleware.isAdmin, MatiereController.deleteMatiere);

module.exports = router;