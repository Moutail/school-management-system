// routes/professeur.routes.js
const express = require('express');
const router = express.Router();
const ProfesseurController = require('../controllers/ProfesseurController');
const { isAdmin } = require('../middleware/authMiddleware');

// Routes accessibles à tous
router.get('/', ProfesseurController.getAllProfesseurs);
router.get('/:professeurId', ProfesseurController.getProfesseurById);

// Routes accessibles uniquement aux administrateurs
router.post('/', isAdmin, ProfesseurController.createProfesseur);
router.put('/:professeurId', isAdmin, ProfesseurController.updateProfesseur);
router.delete('/:professeurId', isAdmin, ProfesseurController.deleteProfesseur);
// Ajouter ces routes dans routes/professeur.routes.js
router.post('/assigner', isAdmin, ProfesseurController.assignerClasse);
router.post('/retirer', isAdmin, ProfesseurController.retirerClasse);
router.get('/:professeurId/classes', ProfesseurController.getClassesForProfesseur);

module.exports = router;