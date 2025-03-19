const jwt = require('jsonwebtoken');
const db = require('../db/dbController'); // Nouveau contrôleur DB

// Clé secrète pour JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_pour_jwt'; // À changer en production
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'votre_clé_secrète_pour_refresh';

class AuthController {
  static async register(req, res) {
    try {
      const { 
        nom, 
        email, 
        password, 
        role, 
        dateNaissance, 
        classeId, 
        matieres, 
        telephone, 
        elevesIds 
      } = req.body;
      
      // Vérifier si l'email existe déjà
      const [professeurs, eleves, admins, parents] = await Promise.all([
        db.getAll('professeurs'),
        db.getAll('eleves'),
        db.getAll('admins'),
        db.getAll('parents'),
      ]);
      
      const emailExists = [
        ...(professeurs || []), 
        ...(eleves || []),
        ...(admins || []),
        ...(parents || [])
      ].some(user => user.email === email);
      
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Déterminer la collection appropriée en fonction du rôle
      let collection;
      switch(role) {
        case 'professeur': 
          collection = 'professeurs';
          break;
        case 'eleve': 
          collection = 'eleves';
          break;
        case 'parent': 
          collection = 'parents';
          break;
        default:
          return res.status(400).json({ message: 'Rôle non valide' });
      }

      // Récupérer tous les utilisateurs de la collection pour déterminer le prochain ID
      const users = await db.getAll(collection);
      
      // Générer un nouvel ID
      const newId = (Math.max(...users.map(item => parseInt(item.id) || 0), 0) + 1).toString();

      // Créer le nouvel utilisateur avec les champs communs
      let newUser = {
        id: newId,
        nom,
        email,
        password,  // En production, vous devriez hacher ce mot de passe
        status: 'actif',
        dateCreation: new Date().toISOString()
      };

      // Ajouter les champs spécifiques selon le rôle
      if (role === 'professeur') {
        newUser.matieres = matieres || [];
        if (classeId) newUser.classeId = classeId;
      } else if (role === 'eleve') {
        newUser.dateNaissance = dateNaissance;
        newUser.classeId = classeId;
      } else if (role === 'parent') {
        newUser.telephone = telephone;
        newUser.elevesIds = elevesIds || [];
      }

      // Insérer le nouvel utilisateur dans la base de données
      await db.insert(collection, newUser);

      // Retourner la réponse sans le mot de passe
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: 'Inscription réussie',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ 
        message: 'Erreur lors de l\'inscription',
        error: error.message 
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password, role } = req.body;
    
      // Vérifier que l'email et le mot de passe sont fournis
      if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
      }
  
      // Variable pour stocker l'utilisateur trouvé
      let user = null;
      let userRole = role;
  
      // Vérifier l'utilisateur en fonction du rôle spécifié
      if (role === 'admin' || !role) {
        const admins = await db.getAll('admins');
        user = admins?.find(a => a.email === email && a.password === password);
        if (user) {
          console.log("Admin trouvé:", user);
          userRole = 'admin';
        }
      }
      
      if ((role === 'professeur' || !role) && !user) {
        const professeurs = await db.getAll('professeurs');
        user = professeurs?.find(p => p.email === email && p.password === password);
        if (user) userRole = 'professeur';
      }

      if ((role === 'eleve' || !role) && !user) {
        const eleves = await db.getAll('eleves');
        user = eleves?.find(e => e.email === email && e.password === password);
        if (user) userRole = 'eleve';
      }

      if ((role === 'parent' || !role) && !user) {
        const parents = await db.getAll('parents');
        user = parents?.find(p => p.email === email && p.password === password);
        if (user) userRole = 'parent';
      }

      // Si aucun utilisateur n'est trouvé
      if (!user) {
        console.log('Utilisateur non trouvé avec email:', email);
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Vérifier le statut de l'utilisateur
      if (user.status !== 'actif') {
        return res.status(403).json({ message: 'Compte désactivé, veuillez contacter l\'administration' });
      }

      // Création du token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: userRole 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Création du refresh token
      const refreshToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: userRole 
        },
        REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Préparation des données de réponse
      const userData = {
        userId: user.id,
        email: user.email,
        nom: user.nom,
        role: userRole,
        token,
        refreshToken
      };

      // Ajouter classeId si disponible
      if (user.classeId) {
        userData.classeId = user.classeId;
      }

      // Si l'utilisateur est un parent, incluez ses enfants
      if (userRole === 'parent' && user.elevesIds) {
        userData.elevesIds = user.elevesIds;
      }

      // Envoyer la réponse
      return res.json({
        ...userData,
        message: 'Connexion réussie'
      });

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  // Méthode pour rafraîchir le token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: 'Token de rafraîchissement requis' });
      }
      
      // Vérifier le token
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      
      // Créer un nouveau token
      const newToken = jwt.sign(
        { 
          userId: decoded.userId, 
          email: decoded.email, 
          role: decoded.role 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      return res.json({ token: newToken });
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      res.status(401).json({ message: 'Token de rafraîchissement invalide' });
    }
  }
}

module.exports = AuthController;