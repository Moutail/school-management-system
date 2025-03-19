// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Route d'inscription
router.post('/register', AuthController.register);

// Route de connexion
router.post('/login', AuthController.login);

// Route pour rafraîchir le token
router.post('/refresh', AuthController.refreshToken);

module.exports = router;