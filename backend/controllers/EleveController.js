// controllers/EleveController.js
const db = require('../db/dbController');

class EleveController {
    static async getElevesByClasse(req, res) {
        try {
          const { classeId } = req.params;
          const { userId, userRole } = req.query;
          
          console.log('getElevesByClasse - Paramètres:', { classeId, userId, userRole });
          
          if (!classeId) {
            return res.status(400).json({ message: 'classeId est requis' });
          }
          
          // Vérifier si la classe existe
          const classe = await db.getById('classes', classeId);
          if (!classe) {
            return res.status(404).json({ message: 'Classe non trouvée' });
          }
          
          console.log('Classe trouvée:', classe.nom);
          
          // IMPORTANT: Ne pas vérifier les permissions ici car c'est déjà fait par le middleware
          // La vérification d'autorisation est supprimée comme dans l'original
          
          // Récupérer tous les élèves
          const eleves = await db.find('eleves', { classeId });
          
          // Ajouter des logs pour le débogage
          console.log(`Élèves trouvés pour la classe ${classeId}:`, eleves.length);
          
          res.json(eleves);
        } catch (error) {
          console.error('Erreur dans getElevesByClasse:', error);
          res.status(500).json({
            message: 'Erreur lors de la récupération des élèves',
            error: error.message
          });
        }
    }
  
    static async getEleveById(req, res) {
        try {
          const { id } = req.params;
          const { userId, userRole } = req.query;
          
          // Récupérer l'élève
          const eleve = await db.getById('eleves', id);
          if (!eleve) {
            return res.status(404).json({ message: 'Élève non trouvé' });
          }
          
          // Vérification des permissions
          if (userRole === 'professeur') {
            // Trouver la classe de l'élève
            const classe = await db.getById('classes', eleve.classeId);
            if (!classe) {
              return res.status(404).json({ message: 'Classe de l\'élève non trouvée' });
            }
            
            // Vérifier si le professeur enseigne dans cette classe
            const enseigneDansClasse = classe.matieres && classe.matieres.some(m => m.professeurId === userId);
            if (!enseigneDansClasse) {
              return res.status(403).json({ message: "Vous n'avez pas accès à cet élève" });
            }
          } else if (userRole === 'eleve' && id !== userId) {
            // Un élève ne peut voir que ses propres informations
            return res.status(403).json({ message: "Vous n'avez pas accès à cet élève" });
          }
          
          res.json(eleve);
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }
  
    static async getAllEleves(req, res) {
        try {
          const { userId, userRole } = req.query;
          
          // Récupérer tous les élèves
          let eleves = await db.getAll('eleves');
          
          // Filtrer selon les permissions
          if (userRole === 'professeur') {
            // Trouver toutes les classes où le professeur enseigne
            const classes = await db.getAll('classes');
            const classesProfesseur = classes
              .filter(classe => classe.matieres && classe.matieres.some(m => m.professeurId === userId))
              .map(classe => classe.id);
            
            // Filtrer les élèves de ces classes uniquement
            eleves = eleves.filter(eleve => classesProfesseur.includes(eleve.classeId));
          } else if (userRole === 'eleve') {
            // Un élève ne voit que ses propres informations
            eleves = eleves.filter(eleve => eleve.id === userId);
          }
          
          // Assurez-vous que les champs nécessaires sont présents
          const formattedEleves = eleves.map(eleve => ({
            id: eleve.id,
            nom: eleve.nom,
            email: eleve.email,
            classeId: eleve.classeId,
            dateNaissance: eleve.dateNaissance,
            status: eleve.status
            // autres champs pertinents...
          }));
          
          res.json(formattedEleves);
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }

    static async createEleve(req, res) {
        try {
          const { nom, email, password, dateNaissance, classeId, status, parentId } = req.body;
          
          if (!nom || !email || !password || !dateNaissance || !classeId) {
            return res.status(400).json({ message: 'Données incomplètes' });
          }
          
          // Vérifier si la classe existe
          const classe = await db.getById('classes', classeId);
          if (!classe) {
            return res.status(400).json({ message: 'Classe inexistante' });
          }
          
          // Générer l'ID pour le nouvel élève
          const newEleveId = Date.now().toString();
          
          const newEleve = {
            id: newEleveId,
            nom,
            email,
            password,
            dateNaissance,
            classeId,
            status: status || 'actif'
          };
          
          // Ajouter le parentId si fourni
          if (parentId) {
            // Vérifier si le parent existe
            const parent = await db.getById('parents', parentId);
            if (!parent) {
              return res.status(400).json({ message: 'Parent inexistant' });
            }
            
            newEleve.parentId = parentId;
            
            // Mettre à jour le parent avec l'ID de l'élève
            const elevesIds = parent.elevesIds || [];
            
            // Ajouter cet élève à la liste des élèves du parent
            if (!elevesIds.includes(newEleveId)) {
              elevesIds.push(newEleveId);
              await db.update('parents', parentId, { elevesIds });
            }
          }
          
          // Insérer le nouvel élève
          await db.insert('eleves', newEleve);
          
          res.status(201).json(newEleve);
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }
  
    static async updateEleve(req, res) {
        try {
          const { id } = req.params;
          const { nom, email, password, dateNaissance, classeId, status, parentId } = req.body;
          
          // Récupérer l'élève existant
          const eleve = await db.getById('eleves', id);
          if (!eleve) {
            return res.status(404).json({ message: 'Élève non trouvé' });
          }
          
          // Sauvegarder l'ancien parentId pour gérer les changements
          const oldParentId = eleve.parentId;
          const newParentId = parentId;
          
          // Vérifier si la classe existe si elle est fournie
          if (classeId) {
            const classe = await db.getById('classes', classeId);
            if (!classe) {
              return res.status(400).json({ message: 'Classe inexistante' });
            }
          }
          
          // Préparer l'objet de mise à jour
          const updateData = {};
          if (nom) updateData.nom = nom;
          if (email) updateData.email = email;
          if (dateNaissance) updateData.dateNaissance = dateNaissance;
          if (classeId) updateData.classeId = classeId;
          if (status) updateData.status = status;
          if (password) updateData.password = password;
          
          // Gérer la relation avec le parent
          if (parentId !== undefined) {
            // Si on assigne un nouveau parent
            if (parentId) {
              // Vérifier si le parent existe
              const parent = await db.getById('parents', parentId);
              if (!parent) {
                return res.status(400).json({ message: 'Parent inexistant' });
              }
              
              // Mettre à jour le parentId de l'élève
              updateData.parentId = parentId;
              
              // Ajouter l'élève au nouveau parent
              const elevesIds = parent.elevesIds || [];
              
              // Ajouter l'élève s'il n'est pas déjà dans la liste
              if (!elevesIds.includes(id)) {
                elevesIds.push(id);
                await db.update('parents', parentId, { elevesIds });
              }
            } else {
              // Si on supprime le parent (parentId est null ou vide)
              updateData.parentId = null;
            }
            
            // Si l'élève avait un ancien parent différent, le retirer de sa liste
            if (oldParentId && oldParentId !== newParentId) {
              const oldParent = await db.getById('parents', oldParentId);
              if (oldParent && oldParent.elevesIds) {
                const updatedElevesIds = oldParent.elevesIds.filter(eId => eId !== id);
                await db.update('parents', oldParentId, { elevesIds: updatedElevesIds });
              }
            }
          }
          
          // Mettre à jour l'élève
          await db.update('eleves', id, updateData);
          
          // Récupérer l'élève mis à jour
          const updatedEleve = await db.getById('eleves', id);
          res.json(updatedEleve);
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }
  
    static async deleteEleve(req, res) {
        try {
          const { id } = req.params;
          
          // Récupérer l'élève avant de le supprimer
          const eleve = await db.getById('eleves', id);
          if (!eleve) {
            return res.status(404).json({ message: 'Élève non trouvé' });
          }
          
          // Supprimer l'élève
          await db.delete('eleves', id);
          
          // Supprimer également les notes associées à cet élève
          const notes = await db.find('notes', { eleveId: id });
          for (const note of notes) {
            await db.delete('notes', note.id);
          }
          
          // Supprimer les soumissions d'exercices
          const soumissions = await db.find('soumissions', { eleveId: id });
          for (const soumission of soumissions) {
            await db.delete('soumissions', soumission.id);
          }
          
          // Supprimer la référence à cet élève de son parent
          if (eleve.parentId) {
            const parent = await db.getById('parents', eleve.parentId);
            if (parent && parent.elevesIds) {
              const updatedElevesIds = parent.elevesIds.filter(eleveId => eleveId !== id);
              await db.update('parents', eleve.parentId, { elevesIds: updatedElevesIds });
            }
          }
          
          res.json({ message: 'Élève supprimé avec succès' });
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }
}

module.exports = EleveController;