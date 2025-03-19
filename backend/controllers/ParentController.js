// controllers/ParentController.js
const db = require('../db/dbController');

class ParentController {
  static async getAllParents(req, res) {
    try {
      // Récupérer tous les parents depuis la base de données
      const parents = await db.getAll('parents');
      
      // Retourner la liste des parents
      res.json(parents);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getParentById(req, res) {
    try {
      const { parentId } = req.params;
      
      // Récupérer le parent par son ID
      const parent = await db.getById('parents', parentId);
      
      // Vérifier si le parent existe
      if (!parent) {
        return res.status(404).json({ message: 'Parent non trouvé' });
      }
      
      res.json(parent);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async createParent(req, res) {
    try {
      const { nom, email, password, telephone, elevesIds } = req.body;
      
      // Vérifier si l'email existe déjà
      const parents = await db.getAll('parents');
      const emailExists = parents.some(p => p.email === email);
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      
      // Créer un nouvel ID
      const newId = Date.now().toString();
      
      // Créer le nouveau parent
      const newParent = {
        id: newId,
        nom,
        email,
        password,
        telephone,
        elevesIds: elevesIds || [],
        status: 'actif',
        dateCreation: new Date().toISOString()
      };
      
      // Ajouter le parent à la collection
      await db.insert('parents', newParent);
      
      // Mettre à jour la référence parentId dans chaque élève
      if (elevesIds && elevesIds.length > 0) {
        for (const eleveId of elevesIds) {
          const eleve = await db.getById('eleves', eleveId);
          if (eleve) {
            await db.update('eleves', eleveId, { parentId: newId });
          }
        }
      }
      
      // Retourner le parent créé (sans le mot de passe)
      const { password: _, ...parentSansPassword } = newParent;
      res.status(201).json(parentSansPassword);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async updateParent(req, res) {
    try {
      const { parentId } = req.params;
      const { nom, email, telephone, elevesIds, status } = req.body;
      
      // Récupérer le parent existant
      const existingParent = await db.getById('parents', parentId);
      
      // Vérifier si le parent existe
      if (!existingParent) {
        return res.status(404).json({ message: 'Parent non trouvé' });
      }
      
      // Conserver l'ancienne liste d'elevesIds pour gérer les modifications
      const ancienneListeEleves = existingParent.elevesIds || [];
      const nouvelleListeEleves = elevesIds || ancienneListeEleves;
      
      // Préparer les mises à jour
      const updates = {
        ...(nom && { nom }),
        ...(email && { email }),
        ...(telephone && { telephone }),
        ...(elevesIds && { elevesIds: nouvelleListeEleves }),
        ...(status && { status }),
        dateModification: new Date().toISOString()
      };
      
      // Mettre à jour le parent
      await db.update('parents', parentId, updates);
      
      // Gérer la mise à jour des références dans les élèves
      if (elevesIds) {
        // 1. Retirer le parentId des élèves qui ne sont plus associés à ce parent
        const elevesRetires = ancienneListeEleves.filter(id => !nouvelleListeEleves.includes(id));
        for (const eleveId of elevesRetires) {
          const eleve = await db.getById('eleves', eleveId);
          if (eleve && eleve.parentId === parentId) {
            // Supprimer la propriété parentId
            const { parentId: _, ...eleveWithoutParentId } = eleve;
            await db.update('eleves', eleveId, eleveWithoutParentId);
          }
        }
        
        // 2. Ajouter le parentId aux nouveaux élèves
        const nouveauxEleves = nouvelleListeEleves.filter(id => !ancienneListeEleves.includes(id));
        for (const eleveId of nouveauxEleves) {
          const eleve = await db.getById('eleves', eleveId);
          if (eleve) {
            await db.update('eleves', eleveId, { parentId: parentId });
          }
        }
      }
      
      // Récupérer le parent mis à jour
      const updatedParent = await db.getById('parents', parentId);
      
      // Retourner le parent mis à jour
      res.json(updatedParent);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteParent(req, res) {
    try {
      const { parentId } = req.params;
      
      // Vérifier si le parent existe
      const parent = await db.getById('parents', parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent non trouvé' });
      }
      
      // Récupérer les IDs des élèves associés
      const elevesIds = parent.elevesIds || [];
      
      // Supprimer les références parentId des élèves associés
      for (const eleveId of elevesIds) {
        const eleve = await db.getById('eleves', eleveId);
        if (eleve && eleve.parentId === parentId) {
          // Supprimer la propriété parentId
          const { parentId: _, ...eleveWithoutParentId } = eleve;
          await db.update('eleves', eleveId, eleveWithoutParentId);
        }
      }
      
      // Supprimer le parent
      await db.delete('parents', parentId);
      
      res.json({ message: 'Parent supprimé avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getElevesForParent(req, res) {
    try {
      const { parentId } = req.params;
      
      // Récupérer le parent par son ID
      const parent = await db.getById('parents', parentId);
      
      // Vérifier si le parent existe
      if (!parent) {
        return res.status(404).json({ message: 'Parent non trouvé' });
      }
      
      // Si le parent n'a pas d'élèves assignés
      if (!parent.elevesIds || parent.elevesIds.length === 0) {
        return res.json([]);
      }
      
      // Récupérer tous les élèves
      const allEleves = await db.getAll('eleves');
      
      // Filtrer les élèves associés au parent
      const eleves = allEleves.filter(e => parent.elevesIds.includes(e.id));
      
      res.json(eleves);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ParentController;