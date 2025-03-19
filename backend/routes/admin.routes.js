// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { isAdmin } = require('../middleware/authMiddleware');
const fs = require('fs');

// Route publique pour la liste des administrateurs (pour la messagerie)
// Utilisez uniquement la méthode du contrôleur pour éviter les doublons
router.get('/list', AdminController.getPublicList);

// Appliquer le middleware isAdmin à toutes les routes suivantes
router.use(isAdmin);

// Routes pour la gestion des administrateurs
router.get('/', AdminController.getAllAdmins);
router.post('/create', AdminController.createAdmin);
router.put('/:adminId', AdminController.updateAdmin);
router.put('/:adminId/deactivate', AdminController.deactivateAdmin);
router.get('/check-primary', AdminController.checkIfPrimaryAdmin);

// Routes existantes
router.get('/system-stats', AdminController.getSystemStats);
router.post('/assigner-classe', AdminController.assignerClasseProfesseur);
router.delete('/retirer-classe/:professeurId/:classeId', AdminController.retirerClasseProfesseur);
router.post('/reset-password/:userType/:userId', AdminController.resetPassword);
router.post('/parent/:parentId/assign-students', AdminController.assignElevesToParent);

// Routes pour les paramètres
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

module.exports = router;