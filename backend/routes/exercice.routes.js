// routes/exercice.routes.js
const express = require('express');
const router = express.Router();
const ExerciceController = require('../controllers/ExerciceController');
const upload = require('../utils/fileUpload');
const authMiddleware = require('../middleware/authMiddleware');

// Route pour obtenir tous les exercices (filtrés par professeur)
router.get('/', authMiddleware.filterParProfesseur, ExerciceController.getAllExercices);

// Route pour obtenir les exercices d'une classe (avec vérification des permissions)
router.get('/classe/:classeId', 
    authMiddleware.canAccessExercicesForClasse,  
    ExerciceController.getExercicesForClasse    // Changé de ExercicesController à ExerciceController
  );

// Route pour obtenir les soumissions d'un exercice (avec vérification des permissions)
router.get('/:exerciceId/soumissions', authMiddleware.canAccessExercice, ExerciceController.getSoumissionsForExercice);

// Route pour obtenir les détails d'un exercice spécifique
router.get('/:exerciceId', authMiddleware.canAccessExercice, ExerciceController.getExerciceDetails);

// Route pour télécharger une soumission
router.get('/soumissions/:soumissionId/download', authMiddleware.canAccessSoumission, ExerciceController.downloadSoumission);

// Route pour uploader un nouvel exercice (professeur uniquement)
router.post('/', authMiddleware.isProfesseur, upload.single('file'), ExerciceController.uploadExercice);

// Route pour soumettre une réponse à un exercice (élève uniquement)
router.post('/soumettre', upload.single('file'), ExerciceController.soumettreExercice);

// Route pour noter une soumission
router.put('/soumissions/:soumissionId/noter', authMiddleware.canAccessSoumission, ExerciceController.noterSoumission);

// Routes pour mettre à jour et supprimer un exercice (uniquement pour le professeur qui l'a créé)
router.put('/:exerciceId', authMiddleware.isOwnExercice, ExerciceController.updateExercice);
router.delete('/:exerciceId', authMiddleware.isOwnExercice, ExerciceController.deleteExercice);

router.get('/soumissions/:exerciceId', authMiddleware.canAccessExercice, ExerciceController.getSoumissionsForExercice);


module.exports = router;