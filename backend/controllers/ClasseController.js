// controllers/ClasseController.js
const db = require('../db/dbController');

class ClasseController {
  static async getAllClasses(req, res) {
    try {
      // Récupérer l'ID du professeur de la requête
      const { professeurId } = req.query;
      
      // Récupérer les données depuis MongoDB
      const classes = await db.getAll('classes');
      const eleves = await db.getAll('eleves');
      
      // Préparer un tableau pour stocker les classes avec le comptage d'élèves
      let classesAvecComptage = [];
      
      // Si un ID de professeur est fourni, filtrer les classes
      if (professeurId) {
        // Trouver toutes les classes assignées à ce professeur
        classesAvecComptage = classes
          .filter(classe => {
            // Vérifier si le professeur enseigne dans cette classe
            const estAssigne = classe.matieres && 
              classe.matieres.some(matiere => matiere.professeurId === professeurId);
              
            return estAssigne;
          })
          .map(classe => {
            // Compter les élèves pour cette classe
            const nombreEleves = eleves.filter(eleve => 
              eleve.classeId === classe.id
            ).length;
            
            return {
              ...classe,
              nombreEleves
            };
          });
      } else {
        // Pour l'admin, retourner toutes les classes avec le comptage d'élèves
        classesAvecComptage = classes.map(classe => {
          // Compter les élèves pour cette classe
          const nombreEleves = eleves.filter(eleve => 
            eleve.classeId === classe.id
          ).length;
          
          return {
            ...classe,
            nombreEleves
          };
        });
      }
      
      res.json(classesAvecComptage);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getClasseById(req, res) {
    try {
      const { classeId } = req.params;
      
      // Récupérer la classe et les élèves depuis MongoDB
      const classe = await db.getById('classes', classeId);
      const eleves = await db.getAll('eleves');
      
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      // Compter les élèves
      const nombreEleves = eleves.filter(e => e.classeId === classeId).length;
      
      res.json({
        ...classe,
        nombreEleves
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async createClasse(req, res) {
    try {
      const { nom, niveau, anneeScolaire } = req.body;
      
      if (!nom || !niveau || !anneeScolaire) {
        return res.status(400).json({ 
          message: 'Nom, niveau et année scolaire sont requis' 
        });
      }
      
      const newClasse = {
        id: Date.now().toString(),
        nom,
        niveau,
        anneeScolaire,
        matieres: []
      };
      
      // Insérer la nouvelle classe dans MongoDB
      await db.insert('classes', newClasse);
      
      res.status(201).json(newClasse);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async updateClasse(req, res) {
    try {
      const { id } = req.body;
      const { nom, niveau, anneeScolaire } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'ID de classe requis' });
      }
      
      // Vérifier si la classe existe dans MongoDB
      const classe = await db.getById('classes', id);
      
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      // Créer l'objet de mise à jour
      const updateData = {};
      
      if (nom) updateData.nom = nom;
      if (niveau) updateData.niveau = niveau;
      if (anneeScolaire) updateData.anneeScolaire = anneeScolaire;
      
      // Mise à jour de la classe dans MongoDB
      await db.update('classes', id, updateData);
      
      // Récupérer la classe mise à jour
      const classeUpdated = await db.getById('classes', id);
      
      // Compter les élèves pour cette classe
      const eleves = await db.getAll('eleves');
      const nombreEleves = eleves.filter(e => e.classeId === id).length;
      
      res.json({
        ...classeUpdated,
        nombreEleves
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteClasse(req, res) {
    try {
      const { classeId } = req.params;
      
      // Vérifier si la classe existe dans MongoDB
      const classe = await db.getById('classes', classeId);
      
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      // Vérifier s'il y a des élèves dans cette classe
      const eleves = await db.getAll('eleves');
      const elevesClasse = eleves.filter(e => e.classeId === classeId);
      
      if (elevesClasse.length > 0) {
        return res.status(400).json({ 
          message: 'Cette classe contient des élèves. Veuillez d\'abord les réaffecter ou les supprimer.' 
        });
      }
      
      // Supprimer la classe de MongoDB
      await db.delete('classes', classeId);
      
      res.json({ message: 'Classe supprimée avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ClasseController;