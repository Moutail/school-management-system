const path = require('path');
const fs = require('fs');
const db = require('../db/dbController');

class MatiereController {
    static async getMatieresForProfesseur(req, res) {
        try {
          const { professeurId } = req.params;
          if (!professeurId) {
            return res.status(400).json({ message: 'ID du professeur requis' });
          }
      
          // Récupérer les classes et les cours de la base de données
          const [classes, cours] = await Promise.all([
            db.getAll('classes'),
            db.getAll('cours')
          ]);
          
          // Obtenir les matières groupées par classe
          const matieresByClasse = [];
          
          classes.forEach(classe => {
            if (classe.matieres) {
              const matieresClasse = classe.matieres
                .filter(matiere => matiere.professeurId === professeurId)
                .map(matiere => {
                  // Compter les cours pour cette matière dans cette classe
                  const coursMatiere = (cours || []).filter(c => 
                    c.matiereId === matiere.id && 
                    c.classeId === classe.id
                  );
                  
                  return {
                    id: matiere.id,
                    nom: matiere.nom,
                    classeId: classe.id,
                    classeName: classe.nom,
                    nombreCours: coursMatiere.length,
                    cours: coursMatiere
                  };
                });
                
              if (matieresClasse.length > 0) {
                matieresByClasse.push({
                  classeId: classe.id,
                  classeName: classe.nom,
                  matieres: matieresClasse
                });
              }
            }
          });
      
          res.json(matieresByClasse);
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }

    static async getAllMatieres(req, res) {
        try {
            // Récupérer toutes les classes
            const classes = await db.getAll('classes');
            
            // Collecter toutes les matières uniques
            const uniqueMatieres = new Map();
            
            classes.forEach(classe => {
                if (classe.matieres) {
                    classe.matieres.forEach(matiere => {
                        if (!uniqueMatieres.has(matiere.id)) {
                            uniqueMatieres.set(matiere.id, {
                                id: matiere.id,
                                nom: matiere.nom,
                                professeurId: matiere.professeurId
                            });
                        }
                    });
                }
            });

            res.json(Array.from(uniqueMatieres.values()));
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getMatiereById(req, res) {
        try {
            const { matiereId } = req.params;
            
            // Récupérer toutes les classes
            const classes = await db.getAll('classes');
            
            let matiereFound = null;
            
            // Chercher la matière dans toutes les classes
            for (const classe of classes) {
                const matiere = classe.matieres?.find(m => m.id === matiereId);
                if (matiere) {
                    matiereFound = {
                        ...matiere,
                        classeId: classe.id,
                        classeName: classe.nom
                    };
                    break;
                }
            }

            if (!matiereFound) {
                return res.status(404).json({ message: 'Matière non trouvée' });
            }

            res.json(matiereFound);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async createMatiere(req, res) {
        try {
            const { nom, professeurId, classeId } = req.body;
            if (!nom || !professeurId || !classeId) {
                return res.status(400).json({ 
                    message: 'Nom, professeurId et classeId sont requis' 
                });
            }

            // Récupérer la classe spécifiée
            const classe = await db.getById('classes', classeId);
            
            if (!classe) {
                return res.status(404).json({ message: 'Classe non trouvée' });
            }

            const newMatiere = {
                id: Date.now().toString(),
                nom,
                professeurId
            };

            // Ajouter la matière à la classe
            if (!classe.matieres) {
                classe.matieres = [];
            }
            classe.matieres.push(newMatiere);

            // Mettre à jour la classe avec la nouvelle matière
            await db.update('classes', classeId, { matieres: classe.matieres });

            res.status(201).json(newMatiere);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getMatieresForClasse(req, res) {
        try {
          const { classeId } = req.params;
          
          if (!classeId) {
            return res.status(400).json({ message: 'ID de classe requis' });
          }
          
          // Récupérer la classe, les professeurs et les cours
          const [classe, professeurs, cours] = await Promise.all([
            db.getById('classes', classeId),
            db.getAll('professeurs'),
            db.getAll('cours')
          ]);
          
          if (!classe) {
            return res.status(404).json({ message: 'Classe non trouvée' });
          }
          
          // Si la classe n'a pas de matières, renvoyer un tableau vide
          if (!classe.matieres || classe.matieres.length === 0) {
            return res.json([]);
          }
          
          // Ajouter des informations supplémentaires sur chaque matière
          const matieres = classe.matieres.map(matiere => {
            // Trouver le professeur associé à cette matière
            const professeur = professeurs.find(p => p.id === matiere.professeurId);
            
            // Compter le nombre de cours pour cette matière
            const nombreCours = (cours || []).filter(
              c => c.matiereId === matiere.id && c.classeId === classeId
            ).length;
            
            return {
              ...matiere,
              classeId,
              classeName: classe.nom,
              professeurNom: professeur ? professeur.nom : 'Non assigné',
              nombreCours
            };
          });
          
          res.json(matieres);
        } catch (error) {
          console.error('Erreur dans getMatieresForClasse:', error);
          res.status(500).json({ message: error.message });
        }
    }

    static async updateMatiere(req, res) {
        try {
            const { matiereId } = req.params;
            const { nom } = req.body;
            const { userId, userRole } = req.query;
            
            // Log pour déboguer
            console.log('Tentative de mise à jour de matière:', { matiereId, nom, userId, userRole });
            
            // Récupérer toutes les classes
            const classes = await db.getAll('classes');
            
            let updated = false;
            let hasPerm = userRole === 'admin'; // Admin a toujours les droits
            
            // Vérifier si le professeur enseigne cette matière
            if (userRole === 'professeur') {
                for (const classe of classes) {
                    if (classe.matieres) {
                        const matiere = classe.matieres.find(m => m.id === matiereId);
                        if (matiere && matiere.professeurId === userId) {
                            hasPerm = true;
                            break;
                        }
                    }
                }
            }
            
            if (!hasPerm) {
                return res.status(403).json({ 
                    message: "Vous n'avez pas les permissions nécessaires pour modifier cette matière" 
                });
            }

            // Mettre à jour la matière dans toutes les classes où elle apparaît
            for (const classe of classes) {
                if (classe.matieres) {
                    const matiereIndex = classe.matieres.findIndex(m => m.id === matiereId);
                    if (matiereIndex !== -1) {
                        const updatedMatieres = [...classe.matieres];
                        updatedMatieres[matiereIndex] = {
                            ...updatedMatieres[matiereIndex],
                            nom
                        };
                        
                        // Mettre à jour la classe avec les matières modifiées
                        await db.update('classes', classe.id, { matieres: updatedMatieres });
                        updated = true;
                    }
                }
            }

            if (!updated) {
                return res.status(404).json({ message: 'Matière non trouvée' });
            }

            res.json({ message: 'Matière mise à jour avec succès' });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteMatiere(req, res) {
        try {
            const { matiereId } = req.params;
            
            // Récupérer les classes, les cours et les notes
            const [classes, cours, notes] = await Promise.all([
                db.getAll('classes'),
                db.getAll('cours'),
                db.getAll('notes')
            ]);
            
            // Supprimer la matière de toutes les classes
            for (const classe of classes) {
                if (classe.matieres && classe.matieres.some(m => m.id === matiereId)) {
                    const updatedMatieres = classe.matieres.filter(m => m.id !== matiereId);
                    await db.update('classes', classe.id, { matieres: updatedMatieres });
                }
            }
            
            // Trouver les cours associés à cette matière
            const coursToDelete = cours.filter(c => c.matiereId === matiereId);
            
            // Supprimer les fichiers physiques des cours
            coursToDelete.forEach(cours => {
                const filePath = path.join(__dirname, '..', cours.filepath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            // Supprimer les cours de la base de données
            for (const cours of coursToDelete) {
                await db.delete('cours', cours.id);
            }
            
            // Supprimer les notes associées
            for (const note of notes) {
                if (note.matiereId === matiereId) {
                    await db.delete('notes', note.id);
                }
            }
            
            res.json({ message: 'Matière et données associées supprimées avec succès' });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = MatiereController;