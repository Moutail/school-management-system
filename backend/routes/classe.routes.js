// routes/classe.routes.js
const express = require('express');
const router = express.Router();
const ClasseController = require('../controllers/ClasseController');
const { isAdmin, canAccessClasse } = require('../middleware/authMiddleware');

// Routes publiques ou filtrées par le middleware
router.get('/', ClasseController.getAllClasses);

// Utilisez cette route avec le middleware canAccessClasse
router.get('/:classeId', canAccessClasse, ClasseController.getClasseById);

// Routes protégées par admin
router.post('/', isAdmin, ClasseController.createClasse);
router.put('/', isAdmin, ClasseController.updateClasse);
router.delete('/:classeId', isAdmin, ClasseController.deleteClasse);

module.exports = router;