// routes/migration.routes.js
const express = require('express');
const router = express.Router();
const dbController = require('../db/dbController');

// Route pour la migration
router.post('/migrate', async (req, res) => {
  try {
    const { collection } = req.query;
    
    if (collection) {
      const result = await dbController.migrateSpecificCollection(collection);
      return res.json({ success: result, collection });
    }
    
    // Migration complète
    const result = await dbController.migrateFromJson();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
