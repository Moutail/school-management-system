// routes/cours.routes.js
const express = require('express');
const router = express.Router();
const CoursController = require('../controllers/CoursController');
const upload = require('../utils/fileUpload');
const authMiddleware = require('../middleware/authMiddleware');

// Upload et création - seul le professeur doit pouvoir créer ses cours
router.post('/upload', authMiddleware.isProfesseur, upload.single('cours'), CoursController.uploadCours);

// Lecture - IMPORTANT: Nous avons retiré enseigneDansClasse car il bloque les élèves après changement de classe
// À la place, nous gérons l'accès directement dans le contrôleur
router.get('/classe/:classeId', CoursController.getCoursForClasse);

router.get('/matiere/:matiereId', authMiddleware.enseigneMatiere, CoursController.getCoursForMatiere);
router.get('/classe/:classeId/matiere/:matiereId', authMiddleware.enseigneMatiere, CoursController.getCoursForClasseAndMatiere);
router.get('/:coursId', authMiddleware.canAccessCours, CoursController.getCoursDetails);

// Mise à jour - vérifier si le professeur est propriétaire du cours
router.put('/:coursId', authMiddleware.canAccessCours, CoursController.updateCours);

// Suppression - vérifier si le professeur est propriétaire du cours
router.delete('/:coursId', authMiddleware.canAccessCours, CoursController.deleteCours);

// Téléchargement - vérifier si le professeur a accès à ce cours
router.get('/:coursId/download', authMiddleware.canAccessCours, CoursController.downloadCours);

// Obtenir tous les cours - filtrer selon les permissions du professeur
router.get('/', authMiddleware.filterParProfesseur, CoursController.getAllCours);

router.post('/assign-professeur', authMiddleware.isAdmin, CoursController.assignProfesseurToCours);

module.exports = router;