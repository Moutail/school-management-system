// controllers/ProfesseurController.js
const db = require('../db/dbController');

class ProfesseurController {
  static async getAllProfesseurs(req, res) {
    try {
      const professeurs = await db.getAll('professeurs');
      res.json(professeurs || []);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Dans ProfesseurController.js
  static async getProfesseurById(req, res) {
    try {
      const { professeurId } = req.params;
      const professeur = await db.getById('professeurs', professeurId);
      
      if (!professeur) {
        return res.status(404).json({ message: 'Professeur non trouvé' });
      }
      
      console.log('Classes assignées au professeur:', professeur.classes);
      res.json(professeur);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async updateProfesseur(req, res) {
    try {
      const { professeurId } = req.params;
      const { nom, email, matiere, telephone } = req.body;
      
      // Vérifier si le professeur existe
      const professeur = await db.getById('professeurs', professeurId);
      
      if (!professeur) {
        return res.status(404).json({ message: 'Professeur non trouvé' });
      }
      
      // Préparer les données de mise à jour
      const updateData = {
        nom: nom || professeur.nom,
        email: email || professeur.email,
        matiere: matiere || professeur.matiere,
        telephone: telephone || professeur.telephone,
      };
      
      // Mettre à jour le professeur
      await db.update('professeurs', professeurId, updateData);
      
      // Récupérer le professeur mis à jour
      const updatedProfesseur = await db.getById('professeurs', professeurId);
      res.json(updatedProfesseur);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async createProfesseur(req, res) {
    try {
      const { nom, email, password, matiere, telephone } = req.body;
      
      // Validation des champs obligatoires
      if (!nom || !email || !password) {
        return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
      }
      
      // Vérifier si l'email existe déjà
      const professeurs = await db.getAll('professeurs');
      const emailExists = professeurs.some(p => p.email === email);
      
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      
      // Créer le nouveau professeur avec status "actif" par défaut
      const newProfesseur = {
        id: Date.now().toString(),
        nom,
        email,
        password,
        matiere: matiere || "",
        telephone: telephone || "",
        classes: [],
        status: "actif" // Ajouter ce champ
      };
      
      // Insérer le nouveau professeur
      await db.insert('professeurs', newProfesseur);
      
      res.status(201).json(newProfesseur);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteProfesseur(req, res) {
    try {
      const { professeurId } = req.params;
      
      // Vérifier si le professeur existe
      const professeur = await db.getById('professeurs', professeurId);
      
      if (!professeur) {
        return res.status(404).json({ message: 'Professeur non trouvé' });
      }
      
      // Supprimer le professeur
      await db.delete('professeurs', professeurId);
      
      res.json({ message: 'Professeur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Assigne une classe à un professeur
   */
  static async assignerClasse(req, res) {
    try {
      const { professeurId, classeId } = req.body;
      const { userId } = req.query;
      
      if (!professeurId || !classeId) {
        return res.status(400).json({ message: 'Les IDs du professeur et de la classe sont requis' });
      }
      
      // Vérifier si le professeur existe
      const professeur = await db.getById('professeurs', professeurId);
      
      if (!professeur) {
        return res.status(404).json({ message: 'Professeur non trouvé' });
      }
      
      // Vérifier si la classe existe
      const classe = await db.getById('classes', classeId);
      
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      // S'assurer que le tableau classes existe
      const classes = professeur.classes || [];
      
      // Ne pas ajouter la classe si elle est déjà présente
      if (!classes.includes(classeId)) {
        classes.push(classeId);
        
        // Mettre à jour le professeur
        await db.update('professeurs', professeurId, { classes });
      }
      
      // Enregistrer un log administratif
      const adminLog = {
        id: Date.now().toString(),
        adminId: userId,
        action: "assign_class",
        details: {
          professeurId,
          classeId,
          professeurNom: professeur.nom,
          classeNom: classe.nom
        },
        date: new Date().toISOString()
      };
      
      await db.insert('adminLogs', adminLog);
      
      // Récupérer le professeur mis à jour
      const updatedProfesseur = await db.getById('professeurs', professeurId);
      
      res.json({
        message: 'Classe assignée avec succès',
        professeur: updatedProfesseur
      });
    } catch (error) {
      console.error('Erreur lors de l\'assignation de classe:', error);
      res.status(500).json({ message: error.message });
    }
  }
  
  /**
   * Retire une classe à un professeur
   */
  static async retirerClasse(req, res) {
    try {
      const { professeurId, classeId } = req.body;
      const { userId } = req.query;
      
      if (!professeurId || !classeId) {
        return res.status(400).json({ message: 'Les IDs du professeur et de la classe sont requis' });
      }
      
      // Vérifier si le professeur existe
      const professeur = await db.getById('professeurs', professeurId);
      
      if (!professeur) {
        return res.status(404).json({ message: 'Professeur non trouvé' });
      }
      
      // Vérifier si la classe existe
      const classe = await db.getById('classes', classeId);
      
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      // S'assurer que le tableau classes existe
      if (!professeur.classes || professeur.classes.length === 0) {
        return res.status(400).json({ message: 'Le professeur n\'a pas de classes assignées' });
      }
      
      // Vérifier si la classe est assignée au professeur
      if (!professeur.classes.includes(classeId)) {
        return res.status(400).json({ message: 'Cette classe n\'est pas assignée au professeur' });
      }
      
      // Retirer la classe
      const updatedClasses = professeur.classes.filter(id => id !== classeId);
      
      // Mettre à jour le professeur
      await db.update('professeurs', professeurId, { classes: updatedClasses });
      
      // Enregistrer un log administratif
      const adminLog = {
        id: Date.now().toString(),
        adminId: userId,
        action: "remove_class",
        details: {
          professeurId,
          classeId,
          professeurNom: professeur.nom,
          classeNom: classe.nom
        },
        date: new Date().toISOString()
      };
      
      await db.insert('adminLogs', adminLog);
      
      // Récupérer le professeur mis à jour
      const updatedProfesseur = await db.getById('professeurs', professeurId);
      
      res.json({
        message: 'Classe retirée avec succès',
        professeur: updatedProfesseur
      });
    } catch (error) {
      console.error('Erreur lors du retrait de classe:', error);
      res.status(500).json({ message: error.message });
    }
  }
  
  /**
   * Récupère les classes assignées à un professeur
   */
  static async getClassesForProfesseur(req, res) {
    try {
      const { professeurId } = req.params;
      console.log('Récupération des classes pour le professeur:', professeurId);
      
      // Récupérer le professeur
      const professeur = await db.getById('professeurs', professeurId);
      
      if (!professeur) {
        console.log('Professeur non trouvé:', professeurId);
        return res.status(404).json({ message: 'Professeur non trouvé' });
      }
      
      console.log('Classes assignées au professeur dans la DB:', professeur.classes);
      
      // Récupérer les informations complètes des classes
      const classesIds = professeur.classes || [];
      const classes = [];
      
      // Pour chaque ID de classe, récupérer les informations complètes
      for (const id of classesIds) {
        const classe = await db.getById('classes', id);
        if (classe) {
          classes.push(classe);
        } else {
          classes.push({ id, nom: 'Classe non trouvée', status: 'inconnue' });
        }
      }
      
      console.log('Classes renvoyées au frontend:', classes);
      res.json(classes);
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ProfesseurController;