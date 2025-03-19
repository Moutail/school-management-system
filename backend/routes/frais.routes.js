// routes/frais.routes.js
const express = require('express');
const router = express.Router();
const FraisController = require('../controllers/FraisController');
const { isAdmin, isParent } = require('../middleware/authMiddleware');

// Route pour obtenir les frais d'un élève (accessible par admin et parent)
router.get('/eleve/:eleveId/frais', (req, res, next) => {
  // Ajouter cette ligne pour déboguer
  console.log("GET frais appelé avec:", req.query);
  
  const { userRole } = req.query;
  // Autoriser soit admin, soit parent
  if (userRole === 'admin' || userRole === 'parent') {
    return next();
  }
  res.status(403).json({ message: "Accès refusé" });
}, FraisController.getFraisForEleve);

// Route pour mettre à jour les frais (admin uniquement)
// Temporairement désactivé pour tester
// router.put('/eleve/:eleveId/frais', isAdmin, FraisController.updateFraisEleve);
router.put('/eleve/:eleveId/frais', (req, res, next) => {
  console.log("PUT frais appelé avec:", req.query, req.body);
  
  // Permettre l'appel même sans middleware pour tester
  FraisController.updateFraisEleve(req, res);
});

module.exports = router;