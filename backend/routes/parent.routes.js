// routes/parent.routes.js
const express = require('express');
const router = express.Router();
const ParentController = require('../controllers/ParentController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes publiques
router.get('/', ParentController.getAllParents);
router.get('/:parentId', ParentController.getParentById);
router.get('/:parentId/eleves', ParentController.getElevesForParent);

// Routes protégées
router.post('/', authMiddleware.isAdmin, ParentController.createParent);
router.put('/:parentId', authMiddleware.isAdmin, ParentController.updateParent);
router.delete('/:parentId', authMiddleware.isAdmin, ParentController.deleteParent);

module.exports = router;