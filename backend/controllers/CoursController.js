// controllers/CoursController.js
const fs = require('fs');
const path = require('path');
const db = require('../db/dbController');

class CoursController {
    // Dans CoursController.js
    static async uploadCours(req, res) {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'Aucun fichier fourni' });
        }

        const { classeId, matiereId, titre, description, professeurId } = req.body;
        
        // Log pour déboguer
        console.log('Données reçues pour upload:', { classeId, matiereId, titre, professeurId });
        
        const newCours = {
          id: Date.now().toString(),
          titre: titre || req.file.originalname,
          description: description || '',
          classeId,
          matiereId,
          professeurId, // Assurez-vous que cette ligne est présente
          filepath: req.file.path.replace('uploads/', ''),
          dateUpload: new Date().toISOString()
        };
        
        // Insérer le nouveau cours dans MongoDB
        await db.insert('cours', newCours);
        
        res.status(201).json(newCours);
      } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: error.message });
      }
    }

    static async getAllCours(req, res) {
        try {
            // Récupérer tous les cours depuis MongoDB
            const cours = await db.getAll('cours');
            res.json(cours);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async assignProfesseurToCours(req, res) {
      try {
        const { coursId, professeurId } = req.body;
        
        // Vérifier si le cours existe
        const cours = await db.getById('cours', coursId);
        
        if (!cours) {
          return res.status(404).json({ message: 'Cours non trouvé' });
        }
        
        // Assigner le professeur au cours
        await db.update('cours', coursId, { professeurId });
        
        // Récupérer le cours mis à jour
        const updatedCours = await db.getById('cours', coursId);
        
        res.json({ message: 'Professeur assigné avec succès', cours: updatedCours });
      } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: error.message });
      }
    }
    
    // Correction de la méthode getCoursForClasse dans CoursController.js
    static async getCoursForClasse(req, res) {
      try {
        const { classeId } = req.params;
        const { userId, userRole } = req.query;
        
        if (!classeId) {
          return res.status(400).json({ message: "L'identifiant de classe est requis" });
        }
        
        console.log('Méthode getCoursForClasse appelée avec:', { classeId, userId, userRole });
        
        // Si c'est un professeur qui fait la demande
        if (userRole === 'professeur') {
          // Récupérer la classe pour obtenir les matières enseignées par le professeur
          const classe = await db.getById('classes', classeId);
          if (!classe) {
            return res.status(404).json({ message: "Classe non trouvée" });
          }
          
          // Extraire les IDs des matières enseignées par ce professeur dans cette classe
          const matieresIds = classe.matieres
            .filter(m => m.professeurId === userId)
            .map(m => m.id);
          
          // Récupérer les cours
          const allCours = await db.getAll('cours');
          
          // Filtrer pour ne garder que les cours pertinents
          const cours = allCours
            .filter(c => c.classeId === classeId && 
              (c.professeurId === userId || matieresIds.includes(c.matiereId)))
            .sort((a, b) => new Date(b.dateUpload) - new Date(a.dateUpload));
          
          return res.json({
            cours,
            statistics: {
              total: cours.length,
              countByMatiere: cours.reduce((acc, c) => {
                if (c.matiereId) {
                  acc[c.matiereId] = (acc[c.matiereId] || 0) + 1;
                }
                return acc;
              }, {})
            }
          });
        }
        
        // Si c'est un élève
        else if (userRole === 'eleve') {
          // Récupérer l'élève
          const eleve = await db.getById('eleves', userId);
          
          if (!eleve) {
            return res.status(404).json({ message: "Élève non trouvé" });
          }
          
          // Trouver la classe pour le log uniquement
          const eleveClasse = await db.getById('classes', eleve.classeId);
          console.log('Classe de l\'élève:', eleveClasse ? eleveClasse.nom : 'Inconnue');
          console.log('Classe demandée:', classeId);
          
          // Récupérer tous les cours
          const allCours = await db.getAll('cours');
          
          // Filtrer pour ne renvoyer que les cours de la classe demandée
          let cours = allCours.filter(c => c.classeId === classeId);
          
          // Si la classe demandée n'est pas celle de l'élève, on peut ajouter un log
          if (eleve.classeId !== classeId) {
            console.log('Attention: L\'élève consulte une classe différente de la sienne');
          }
          
          cours = cours.sort((a, b) => new Date(b.dateUpload) - new Date(a.dateUpload));
          
          return res.json({
            cours,
            statistics: {
              total: cours.length,
              countByMatiere: cours.reduce((acc, c) => {
                if (c.matiereId) {
                  acc[c.matiereId] = (acc[c.matiereId] || 0) + 1;
                }
                return acc;
              }, {})
            }
          });
        }
        
        // Pour les administrateurs, retourner tous les cours
        const allCours = await db.getAll('cours');
        const cours = allCours
          .filter(c => c.classeId === classeId)
          .sort((a, b) => new Date(b.dateUpload) - new Date(a.dateUpload));
        
        res.json({
          cours,
          statistics: {
            total: cours.length,
            countByMatiere: cours.reduce((acc, c) => {
              if (c.matiereId) {
                acc[c.matiereId] = (acc[c.matiereId] || 0) + 1;
              }
              return acc;
            }, {})
          }
        });
      } catch (error) {
        console.error('Erreur dans getCoursForClasse:', error);
        res.status(500).json({ message: error.message });
      }
    }

    static async getCoursForMatiere(req, res) {
        try {
            const { matiereId } = req.params;
            
            // Récupérer tous les cours
            const allCours = await db.getAll('cours');
            
            // Filtrer les cours par matière
            const cours = allCours
                .filter(c => c.matiereId === matiereId)
                .sort((a, b) => new Date(b.dateUpload) - new Date(a.dateUpload));
            
            res.json({
                cours,
                count: cours.length
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getCoursForClasseAndMatiere(req, res) {
        try {
            const { classeId, matiereId } = req.params;
            
            // Récupérer tous les cours
            const allCours = await db.getAll('cours');
            
            // Filtrer les cours par classe et matière
            const cours = allCours
                .filter(c => c.classeId === classeId && c.matiereId === matiereId)
                .sort((a, b) => new Date(b.dateUpload) - new Date(a.dateUpload));
            
            res.json({
                cours,
                count: cours.length
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getCoursDetails(req, res) {
        try {
            const { coursId } = req.params;
            
            // Récupérer le cours par son ID
            const cours = await db.getById('cours', coursId);
            if (!cours) {
                return res.status(404).json({ message: 'Cours non trouvé' });
            }
            
            res.json(cours);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async updateCours(req, res) {
        try {
            const { coursId } = req.params;
            const { titre, description } = req.body;
            
            // Vérifier si le cours existe
            const cours = await db.getById('cours', coursId);
            if (!cours) {
                return res.status(404).json({ message: 'Cours non trouvé' });
            }
            
            // Préparer les données de mise à jour
            const updateData = {
                titre: titre || cours.titre,
                description: description || cours.description,
                dateModification: new Date().toISOString()
            };
            
            // Mettre à jour le cours
            await db.update('cours', coursId, updateData);
            
            // Récupérer le cours mis à jour
            const updatedCours = await db.getById('cours', coursId);
            res.json(updatedCours);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteCours(req, res) {
        try {
            const { coursId } = req.params;
            
            // Récupérer le cours
            const cours = await db.getById('cours', coursId);
            if (!cours) {
                return res.status(404).json({ message: 'Cours non trouvé' });
            }
            
            // Supprimer le fichier physique
            const filePath = path.join(__dirname, '..', cours.filepath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // Supprimer le cours de la base de données
            await db.delete('cours', coursId);
            
            res.json({ message: 'Cours supprimé avec succès' });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async downloadCours(req, res) {
        try {
            const { coursId } = req.params;
            
            // Récupérer le cours
            const cours = await db.getById('cours', coursId);
            if (!cours) {
                return res.status(404).json({ message: 'Cours non trouvé' });
            }
            
            const filePath = path.join(__dirname, '..', cours.filepath);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Fichier non trouvé' });
            }
            
            res.download(filePath, cours.titre);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = CoursController;