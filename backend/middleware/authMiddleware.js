// middleware/authMiddleware.js
const fs = require('fs');

// Vérifier si l'utilisateur est un professeur
const isProfesseur = (req, res, next) => {
  const { userRole } = req.query;
  
  if (userRole !== 'professeur') {
    return res.status(403).json({ message: "Accès refusé. Rôle professeur requis." });
  }
  
  next();
};

// Version améliorée du middleware isOwnCours
const isOwnCours = async (req, res, next) => {
  const { coursId } = req.params;
  const { userId, userRole } = req.query;
  
  // Si c'est un admin, autoriser l'accès
  if (userRole === 'admin') {
    console.log('Admin accès autorisé');
    return next();
  }
  
  try {
    // Logs pour déboguer
    console.log('Vérification des permissions pour le cours:', coursId);
    console.log('Utilisateur connecté:', userId, 'Type:', typeof userId);
    
    const data = JSON.parse(fs.readFileSync('db.json'));
    const cours = data.cours.find(c => c.id === coursId);
    
    if (!cours) {
      console.log('Cours non trouvé:', coursId);
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    console.log('Cours trouvé:', cours);
    console.log('Propriétaire du cours:', cours.professeurId, 'Type:', typeof cours.professeurId);
    
    // Si le cours n'a pas de professeurId, autoriser l'accès
    if (!cours.professeurId) {
      console.log('Cours sans propriétaire, accès autorisé');
      // Optionnel: mettre à jour le cours avec le professeurId actuel
      cours.professeurId = userId;
      fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
      return next();
    }
    
    // Convertir les deux valeurs en chaînes pour s'assurer que la comparaison fonctionne
    if (String(cours.professeurId) !== String(userId)) {
      console.log('Accès refusé: propriétaire du cours différent de l\'utilisateur');
      return res.status(403).json({ 
        message: "Vous n'avez pas l'autorisation de modifier ce cours",
        details: {
          coursId: coursId,
          coursProprietaire: cours.professeurId,
          utilisateurConnecte: userId
        }
      });
    }
    
    console.log('Accès autorisé: l\'utilisateur est le propriétaire du cours');
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Vérifier si le professeur enseigne dans une classe spécifique
const enseigneDansClasse = (req, res, next) => {
  const { classeId } = req.params;
  const { userId, userRole } = req.query;
  
  if (!classeId || !userId) {
    return res.status(400).json({ message: "Paramètres manquants" });
  }

  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Vérifier l'assignation directe si c'est un professeur
    if (userRole === 'professeur') {
      const professeur = data.professeurs.find(p => p.id === userId);
      if (professeur && professeur.classes && professeur.classes.includes(classeId)) {
        console.log('Accès autorisé via classe assignée directement');
        return next();
      }
    }
    
    const classe = data.classes.find(c => c.id === classeId);
    
    if (!classe) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }
    
    if (!classe.matieres || !classe.matieres.some(m => m.professeurId === userId)) {
      return res.status(403).json({ 
        message: "Vous n'enseignez pas dans cette classe."
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};
// Vérifier si le professeur enseigne cette matière
// Middleware enseigneMatiere amélioré
const enseigneMatiere = async (req, res, next) => {
  const { matiereId } = req.params;
  const { userId, userRole } = req.query;
  
  console.log('enseigneMatiere - Vérification des permissions:', { matiereId, userId, userRole });
  
  // Si userId est undefined ou null, retourner une erreur 401
  if (!userId) {
    return res.status(401).json({ message: "ID utilisateur manquant" });
  }
  
  // Les admins ont toujours accès
  if (userRole === 'admin') {
    console.log('Accès admin autorisé');
    return next();
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Si c'est un professeur, vérifier s'il enseigne cette matière
    if (userRole === 'professeur') {
      let matiereFound = false;
      
      // Parcourir toutes les classes pour trouver la matière
      for (const classe of data.classes) {
        if (classe.matieres) {
          const matiere = classe.matieres.find(m => m.id === matiereId);
          if (matiere) {
            console.log('Matière trouvée:', matiere.nom, 'dans classe:', classe.nom);
            console.log('ProfesseurId de la matière:', matiere.professeurId, 'UserId:', userId);
            
            // Convertir les IDs en chaînes pour la comparaison
            if (String(matiere.professeurId) === String(userId)) {
              console.log('Le professeur enseigne cette matière');
              matiereFound = true;
              // Stocker les informations de la matière pour une utilisation ultérieure
              req.matiere = { ...matiere, classeId: classe.id, classeName: classe.nom };
              break;
            }
          }
        }
      }
      
      if (matiereFound) {
        return next();
      }
      
      console.log('Le professeur n\'enseigne pas cette matière');
      return res.status(403).json({ 
        message: "Vous n'enseignez pas cette matière"
      });
    }
    
    // Si c'est un élève, vérifier si cette matière est enseignée dans sa classe
    if (userRole === 'eleve') {
      const eleve = data.eleves.find(e => e.id === userId);
      if (!eleve) {
        return res.status(404).json({ message: "Élève non trouvé" });
      }
      
      const classe = data.classes.find(c => c.id === eleve.classeId);
      if (!classe || !classe.matieres) {
        return res.status(404).json({ message: "Classe non trouvée ou sans matières" });
      }
      
      const matiere = classe.matieres.find(m => m.id === matiereId);
      if (matiere) {
        return next();
      }
      
      return res.status(403).json({ 
        message: "Cette matière n'est pas enseignée dans votre classe"
      });
    }
    
    // Si nous arrivons ici, le rôle n'est pas reconnu ou n'a pas accès
    return res.status(403).json({ 
      message: "Accès refusé. Rôle utilisateur non reconnu ou non autorisé." 
    });
    
  } catch (error) {
    console.error('Erreur middleware enseigneMatiere:', error);
    res.status(500).json({ message: error.message });
  }
};

// Ajouter au fichier middleware/authMiddleware.js
// Correction du middleware canAccessClasse
const canAccessClasse = async (req, res, next) => {
  const { classeId } = req.params;
  const { userId, userRole } = req.query;
  
  console.log('canAccessClasse - Vérification des accès:', { classeId, userId, userRole });
  
  // Les admins ont toujours accès
  if (userRole === 'admin') {
    console.log('Accès admin autorisé');
    return next();
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Vérifier si le professeur a des classes assignées directement
    if (userRole === 'professeur') {
      const professeur = data.professeurs.find(p => p.id === userId);
      console.log('Professeur trouvé:', professeur ? professeur.nom : 'Non trouvé', 'ID:', userId);
      
      if (professeur && professeur.classes && professeur.classes.includes(classeId)) {
        console.log('Accès autorisé via classe assignée directement');
        return next();
      }
      
      // Si le professeur n'a pas accès direct, vérifier s'il enseigne une matière dans cette classe
      const classe = data.classes.find(c => c.id === classeId);
      if (!classe) {
        console.log('Classe non trouvée:', classeId);
        return res.status(404).json({ message: "Classe non trouvée" });
      }
      
      console.log('Classe trouvée:', classe.nom, 'ID:', classe.id);
      console.log('Matières dans la classe:', classe.matieres ? classe.matieres.length : 0);
      
      // Vérifier si le professeur enseigne une matière dans cette classe
      const enseigneMatiere = classe.matieres && classe.matieres.some(m => {
        console.log('Vérification matière:', m.nom, 'ProfesseurId:', m.professeurId, 'UserId:', userId);
        return String(m.professeurId) === String(userId);
      });
      
      if (enseigneMatiere) {
        console.log('Accès autorisé: le professeur enseigne une matière dans cette classe');
        return next();
      }
      
      console.log('Accès refusé: le professeur n\'enseigne pas dans cette classe');
      return res.status(403).json({ 
        message: "Vous n'enseignez pas dans cette classe" 
      });
    }
    
    // Si c'est un élève, vérifier qu'il appartient à cette classe ou lui donner accès peu importe
    if (userRole === 'eleve') {
      const eleve = data.eleves.find(e => e.id === userId);
      
      if (!eleve) {
        return res.status(404).json({ message: "Élève non trouvé" });
      }
      
      // On peut soit vérifier strictement, soit permettre l'accès aux autres classes
      if (eleve.classeId === classeId) {
        console.log('Élève autorisé - classe correspondante');
        return next();
      }
      
      console.log('Élève consulte une classe différente de la sienne');
      // Pour permettre l'accès même si la classe ne correspond pas:
      return next();
      
      // Ou pour bloquer l'accès (décommenter la ligne suivante et supprimer le 'return next()' ci-dessus):
      // return res.status(403).json({ message: "Vous n'avez pas accès aux informations de cette classe" });
    }
    
    // Pour les parents, vérifier si un de leurs enfants est dans cette classe
    if (userRole === 'parent') {
      const parent = data.parents.find(p => p.id === userId);
      
      if (!parent) {
        return res.status(404).json({ message: "Parent non trouvé" });
      }
      
      // Vérifier si un des enfants du parent est dans cette classe
      const enfantsDansClasse = data.eleves.some(e => 
        parent.elevesIds.includes(e.id) && e.classeId === classeId
      );
      
      if (enfantsDansClasse) {
        return next();
      }
      
      return res.status(403).json({ 
        message: "Aucun de vos enfants n'est dans cette classe" 
      });
    }
    
    // Si aucun des cas ci-dessus ne s'applique
    return res.status(403).json({ 
      message: "Accès refusé. Rôle utilisateur non reconnu ou non autorisé." 
    });
    
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};
// Middleware pour filtrer la liste de toutes les classes
const filterClasses = async (req, res, next) => {
  const { userId, userRole } = req.query;
  
  // Si admin, pas de filtre
  if (userRole === 'admin') {
    return next();
  }
  
  // Ajouter une propriété au req pour le filtrage
  req.filterByUser = { userId, userRole };
  next();
};
// Vérifier si le professeur a accès à ce cours (soit il est le créateur, soit il enseigne la matière)
const canAccessCours = async (req, res, next) => {
  const { coursId } = req.params;
  const { userId, userRole } = req.query;
  
  // Ajouter des logs pour déboguer
  console.log('canAccessCours - Vérification des accès:', { coursId, userId, userRole });
  
  // Si c'est un admin, permettre l'accès
  if (userRole === 'admin') {
    return next();
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const cours = data.cours.find(c => c.id === coursId);
    
    if (!cours) {
      console.log('Cours non trouvé:', coursId);
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    console.log('Détails du cours:', cours);
    
    // Si le cours n'a pas de propriétaire (professeurId), assignez-le au professeur actuel
    if (!cours.professeurId && userRole === 'professeur') {
      cours.professeurId = userId;
      fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
      console.log('Cours sans propriétaire, assigné à:', userId);
      return next();
    }
    
    // Si c'est un élève, vérifier qu'il est dans la bonne classe
    if (userRole === 'eleve') {
      const eleve = data.eleves.find(e => e.id === userId);
      
      // Assurez-vous que l'élève existe
      if (!eleve) {
        return res.status(404).json({ message: "Élève non trouvé" });
      }
      
      // Vérifier si l'ID de la classe de l'élève correspond à l'ID de la classe du cours
      if (eleve.classeId === cours.classeId) {
        console.log('Accès élève autorisé - même classe');
        return next();
      }
      
      return res.status(403).json({ message: "Vous n'avez pas accès à ce cours" });
    }
    
    // Si c'est un professeur, vérifier s'il est le créateur ou s'il enseigne la matière
    if (userRole === 'professeur') {
      if (cours.professeurId === userId) {
        return next();
      }
      
      // Vérifier si le professeur enseigne cette matière dans cette classe
      const classe = data.classes.find(c => c.id === cours.classeId);
      const matiere = classe?.matieres?.find(m => m.id === cours.matiereId);
      
      if (matiere && matiere.professeurId === userId) {
        return next();
      }
      
      return res.status(403).json({ message: "Vous n'avez pas accès à ce cours" });
    }
    
    return res.status(403).json({ message: "Accès non autorisé" });
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Middlewares pour les exercices
const isOwnExercice = async (req, res, next) => {
  const { exerciceId } = req.params;
  const { userId } = req.query;
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const exercice = data.exercices.find(e => e.id === exerciceId);
    
    if (!exercice) {
      return res.status(404).json({ message: 'Exercice non trouvé' });
    }
    
    if (exercice.professeurId !== userId) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorisation de modifier cet exercice" });
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Vérifier l'accès à une soumission
const canAccessSoumission = async (req, res, next) => {
  const { soumissionId } = req.params;
  const { userId, userRole } = req.query;
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const soumission = data.soumissions.find(s => s.id === soumissionId);
    
    if (!soumission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }
    
    // Si c'est un élève, vérifier que c'est sa propre soumission
    if (userRole === 'eleve') {
      if (soumission.eleveId !== userId) {
        return res.status(403).json({ message: "Ce n'est pas votre soumission" });
      }
      return next();
    }
    
    // Si c'est un professeur, vérifier qu'il est le créateur de l'exercice
    const exercice = data.exercices.find(e => e.id === soumission.exerciceId);
    
    if (!exercice) {
      return res.status(404).json({ message: 'Exercice non trouvé' });
    }
    
    if (exercice.professeurId !== userId) {
      // Vérifier si le professeur enseigne cette matière
      const classe = data.classes.find(c => c.id === exercice.classeId);
      const matiere = classe?.matieres?.find(m => m.id === exercice.matiereId);
      
      if (!matiere || matiere.professeurId !== userId) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette soumission" });
      }
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Filtrer les résultats selon le rôle et l'ID de l'utilisateur
const filterParProfesseur = async (req, res, next) => {
  // Ce middleware ne bloque pas l'accès mais injecte des paramètres pour filtrer les résultats
  const { userId, userRole } = req.query;
  
  if (userRole === 'professeur') {
    req.filterByProfesseur = userId;
  }
  
  next();
};

const canAccessExercice = async (req, res, next) => {
  const { exerciceId } = req.params;
  const { userId, userRole } = req.query;
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const exercice = data.exercices.find(e => e.id === exerciceId);
    
    if (!exercice) {
      return res.status(404).json({ message: 'Exercice non trouvé' });
    }
    
    // Si c'est un élève, vérifier qu'il est dans la bonne classe
    if (userRole === 'eleve') {
      const eleve = data.eleves.find(e => e.id === userId);
      if (!eleve || eleve.classeId !== exercice.classeId) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cet exercice" });
      }
      return next();
    }
    
    // Si c'est un professeur, vérifier s'il est le créateur ou s'il enseigne la matière
    if (exercice.professeurId === userId) {
      return next();
    }
    
    // Vérifier si le professeur enseigne cette matière dans cette classe
    const classe = data.classes.find(c => c.id === exercice.classeId);
    const matiere = classe?.matieres?.find(m => m.id === exercice.matiereId);
    
    if (!matiere || matiere.professeurId !== userId) {
      return res.status(403).json({ message: "Vous n'avez pas accès à cet exercice" });
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Vérifier si le professeur peut ajouter une note pour cette matière/élève
const canAddNote = async (req, res, next) => {
  const { eleveId, matiereId, professeurId } = req.body;
  
  if (!eleveId || !matiereId || !professeurId) {
    return res.status(400).json({ message: 'Données manquantes pour l\'autorisation' });
  }
  
  // Vérifier que le professeurId dans le body correspond à l'utilisateur authentifié
  if (professeurId !== req.query.userId) {
    return res.status(403).json({ message: 'ID professeur non valide' });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Vérifier si l'élève existe et sa classe
    const eleve = data.eleves.find(e => e.id === eleveId);
    if (!eleve) {
      return res.status(404).json({ message: 'Élève non trouvé' });
    }
    
    // Vérifier si le professeur enseigne cette matière dans cette classe
    const classe = data.classes.find(c => c.id === eleve.classeId);
    if (!classe || !classe.matieres) {
      return res.status(404).json({ message: 'Classe non trouvée ou sans matières' });
    }
    
    const matiere = classe.matieres.find(m => m.id === matiereId);
    if (!matiere || matiere.professeurId !== professeurId) {
      return res.status(403).json({ 
        message: "Vous n'enseignez pas cette matière dans la classe de cet élève"
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Vérifier si le professeur peut accéder aux notes d'un élève
// Middleware pour vérifier si un utilisateur peut accéder aux notes d'un élève
const canAccessEleveNotes = async (req, res, next) => {
  const { eleveId, matiereId } = req.params;
  const { userId, userRole } = req.query;
  
  // Si l'utilisateur n'est pas authentifié
  if (!userId || !userRole) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  
  // Les admins ont toujours accès
  if (userRole === 'admin') {
    return next();
  }
  
  // Les élèves ne peuvent voir que leurs propres notes
  if (userRole === 'eleve') {
    if (userId === eleveId) {
      return next();
    } else {
      return res.status(403).json({ message: "Vous ne pouvez consulter que vos propres notes" });
    }
  }
  
  // Pour les professeurs, vérifier qu'ils enseignent les matières concernées à cet élève
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Obtenir les informations de l'élève
    const eleve = data.eleves.find(e => e.id === eleveId);
    if (!eleve) {
      return res.status(404).json({ message: 'Élève non trouvé' });
    }
    
    // Trouver la classe de l'élève
    const classe = data.classes.find(c => c.id === eleve.classeId);
    if (!classe || !classe.matieres) {
      return res.status(404).json({ message: 'Classe non trouvée ou sans matières' });
    }
    
    // Filtrer les matières enseignées par ce professeur dans cette classe
    const matieresEnseignees = classe.matieres
      .filter(m => m.professeurId === userId)
      .map(m => m.id);
    
    // Si aucune matière n'est enseignée par ce professeur dans cette classe
    if (matieresEnseignees.length === 0) {
      return res.status(403).json({ 
        message: "Vous n'enseignez aucune matière dans la classe de cet élève"
      });
    }
    
    // Si une matière spécifique est demandée, vérifier que le professeur l'enseigne
    if (matiereId && !matieresEnseignees.includes(matiereId)) {
      return res.status(403).json({ 
        message: "Vous n'enseignez pas cette matière à cet élève"
      });
    }
    
    // Ajouter les matières enseignées au req pour filtrer les notes dans le contrôleur
    req.matieresEnseignees = matieresEnseignees;
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
  
};

// Vérifier si le professeur est propriétaire de la note
const isOwnNote = async (req, res, next) => {
  const { id } = req.params;
  const { userId, userRole } = req.query;
  
  // Les admins ont toujours accès
  if (userRole === 'admin') {
    return next();
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Trouver la note
    const note = data.notes.find(n => n.id === id);
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée' });
    }
    
    // Si la note a un champ professeurId, vérifier qu'il correspond
    if (note.professeurId && note.professeurId !== userId) {
      return res.status(403).json({ message: "Vous n'êtes pas l'auteur de cette note" });
    }
    
    // Si pas de professeurId, vérifier via matière et classe
    if (!note.professeurId) {
      // Trouver l'élève et sa classe
      const eleve = data.eleves.find(e => e.id === note.eleveId);
      if (!eleve) {
        return res.status(404).json({ message: 'Élève non trouvé' });
      }
      
      // Vérifier si le professeur enseigne cette matière dans cette classe
      const classe = data.classes.find(c => c.id === eleve.classeId);
      if (!classe || !classe.matieres) {
        return res.status(404).json({ message: 'Classe non trouvée ou sans matières' });
      }
      
      const matiere = classe.matieres.find(m => m.id === note.matiereId);
      if (!matiere || matiere.professeurId !== userId) {
        return res.status(403).json({ 
          message: "Vous n'êtes pas autorisé à modifier cette note"
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

// Middleware pour vérifier si l'utilisateur est un administrateur
const isAdmin = async (req, res, next) => {
  const { userId, userRole } = req.query;
  
  console.log('Vérification admin:', { userId, userRole });
  
  if (!userId || userRole !== 'admin') {
    return res.status(403).json({ 
      message: "Accès refusé. Privilèges administrateur requis." 
    });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const admin = data.admins.find(a => a.id === userId);
    
    console.log('Admin trouvé:', admin);
    
    if (!admin) {
      return res.status(403).json({ 
        message: "Administrateur non trouvé. Accès refusé." 
      });
    }
    
    // L'utilisateur est bien un administrateur
    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    res.status(500).json({ message: error.message });
  }
};

const isParent = async (req, res, next) => {
  const { userId, userRole } = req.query;
  
  // Ajouter cette ligne pour déboguer
  console.log("Middleware isParent appelé avec:", { userId, userRole });
  
  // Autoriser l'admin également
  if (userRole === 'admin') {
    return next();
  }
  
  if (!userId || userRole !== 'parent') {
    return res.status(403).json({ 
      message: "Accès refusé. Vous devez être connecté en tant que parent." 
    });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const parent = data.parents.find(p => p.id === userId);
    
    if (!parent) {
      return res.status(403).json({ 
        message: "Parent non trouvé. Accès refusé." 
      });
    }
    
    // Vérifier si le parent a accès à l'élève spécifié (si un ID d'élève est fourni)
    if (req.params.eleveId && !parent.elevesIds.includes(req.params.eleveId)) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès aux informations de cet élève." 
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware parent:', error);
    res.status(500).json({ message: error.message });
  }
};

const canParentAccessClasse = async (req, res, next) => {
  const { classeId } = req.params;
  const { userId, userRole, eleveId } = req.query;
  
  if (userRole !== 'parent') {
    return next(); // Passer au middleware suivant si ce n'est pas un parent
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Vérifier si le parent existe
    const parent = data.parents.find(p => p.id === userId);
    if (!parent) {
      return res.status(403).json({ message: "Parent non trouvé" });
    }
    
    // Vérifier si l'élève spécifié appartient à ce parent
    if (eleveId && !parent.elevesIds.includes(eleveId)) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès aux informations de cet élève" 
      });
    }
    
    // Si un eleveId est fourni, vérifier que l'élève est bien dans cette classe
    if (eleveId) {
      const eleve = data.eleves.find(e => e.id === eleveId);
      if (!eleve) {
        return res.status(404).json({ message: "Élève non trouvé" });
      }
      
      if (eleve.classeId !== classeId) {
        return res.status(403).json({ 
          message: "Cet élève n'est pas dans cette classe" 
        });
      }
      
      // Accès autorisé
      return next();
    }
    
    // Si aucun eleveId n'est fourni, vérifier si au moins un des enfants du parent est dans cette classe
    const elevesDuParent = data.eleves.filter(e => parent.elevesIds.includes(e.id));
    const estDansClasse = elevesDuParent.some(e => e.classeId === classeId);
    
    if (!estDansClasse) {
      return res.status(403).json({ 
        message: "Aucun de vos enfants n'est dans cette classe" 
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

const canAccessExercicesForClasse = async (req, res, next) => {
  const { classeId } = req.params;
  const { userId, userRole, eleveId } = req.query;
  
  // Les admins ont toujours accès
  if (userRole === 'admin') {
    return next();
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('db.json'));
    
    // Si c'est un élève, vérifier qu'il appartient à cette classe
    if (userRole === 'eleve') {
      const eleve = data.eleves.find(e => e.id === userId);
      
      if (!eleve) {
        return res.status(404).json({ message: 'Élève non trouvé' });
      }
      
      if (eleve.classeId !== classeId) {
        return res.status(403).json({ 
          message: "Vous n'avez pas accès aux exercices de cette classe" 
        });
      }
      
      return next();
    }
    
    // Si c'est un parent, vérifier que son enfant est dans cette classe
    if (userRole === 'parent' && eleveId) {
      const parent = data.parents.find(p => p.id === userId);
      
      if (!parent) {
        return res.status(404).json({ message: 'Parent non trouvé' });
      }
      
      // Vérifier si l'élève appartient à ce parent
      if (!parent.elevesIds.includes(eleveId)) {
        return res.status(403).json({ 
          message: "Vous n'avez pas accès aux informations de cet élève" 
        });
      }
      
      // Vérifier si l'élève est dans cette classe
      const eleve = data.eleves.find(e => e.id === eleveId);
      
      if (!eleve) {
        return res.status(404).json({ message: 'Élève non trouvé' });
      }
      
      if (eleve.classeId !== classeId) {
        return res.status(403).json({ 
          message: "Cet élève n'appartient pas à cette classe" 
        });
      }
      
      return next();
    }
    
    // Pour les professeurs, vérifier s'ils enseignent dans cette classe
    if (userRole === 'professeur') {
      const classe = data.classes.find(c => c.id === classeId);
      
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      if (!classe.matieres || !classe.matieres.some(m => m.professeurId === userId)) {
        return res.status(403).json({ 
          message: "Vous n'enseignez pas dans cette classe" 
        });
      }
      
      return next();
    }
    
    // Si aucun des cas ci-dessus ne s'applique
    return res.status(403).json({ message: "Accès non autorisé" });
    
  } catch (error) {
    console.error('Erreur middleware:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  isAdmin,
  isProfesseur,
  enseigneDansClasse,
  isOwnCours,
  enseigneMatiere,
  canAccessCours,
  isOwnExercice,
  canAccessExercice,
  canAccessSoumission,
  filterParProfesseur,
  canAddNote,
  canAccessEleveNotes,
  isOwnNote,
  canAccessClasse,
  filterClasses,
  isParent,
  canParentAccessClasse,
  canAccessExercicesForClasse
};