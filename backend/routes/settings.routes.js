// routes/settings.routes.js
const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { isAdmin } = require('../middleware/authMiddleware');

// Appliquer le middleware isAdmin à toutes les routes
router.use(isAdmin);

router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);
router.post('/backup', SettingsController.createBackup);
router.get('/diagnose', SettingsController.diagnoseSettings);
module.exports = router;