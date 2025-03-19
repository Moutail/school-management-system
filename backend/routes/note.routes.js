// routes/note.routes.js
const express = require('express');
const router = express.Router();
const NoteController = require('../controllers/NoteController');
const authMiddleware = require('../middleware/authMiddleware');

// Ajouter une note - vérifier que le professeur enseigne cette matière
router.post('/', authMiddleware.isProfesseur, authMiddleware.canAddNote, NoteController.ajouterNote);

// Obtenir les notes d'un élève (optionnellement filtré par matière)
router.get('/eleve/:eleveId/matiere/:matiereId?', authMiddleware.canAccessEleveNotes, NoteController.getNotesForEleve);

// Obtenir les notes d'une classe (optionnellement filtré par matière)
router.get('/classe/:classeId/matiere/:matiereId?', authMiddleware.enseigneMatiere, NoteController.getNotesForClasse);

// Route simplifiée pour obtenir toutes les notes d'un élève
router.get('/eleve/:eleveId', authMiddleware.canAccessEleveNotes, NoteController.getNotesForEleve);

// Modifier une note - vérifier que le professeur a créé cette note
router.put('/:id', authMiddleware.isOwnNote, NoteController.modifierNote);
router.delete('/:id', authMiddleware.isOwnNote, NoteController.supprimerNote);

module.exports = router;