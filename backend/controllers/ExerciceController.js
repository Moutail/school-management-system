// controllers/ExerciceController.js
const db = require('../db/dbController');
const path = require('path');
const fs = require('fs');

class ExerciceController {
    static async getAllExercices(req, res) {
      try {
        const exercices = await db.getAll('exercices');
        
        // Si le filtre par professeur est défini (via le middleware filterParProfesseur)
        if (req.filterByProfesseur) {
          const filteredExercices = exercices.filter(ex => ex.professeurId === req.filterByProfesseur);
          return res.json(filteredExercices);
        }
        
        res.json(exercices);
      } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: error.message });
      }
  }

  static async getSoumissionsForExercice(req, res) {
    try {
      const { exerciceId } = req.params;
      const { userId, userRole } = req.query;
      
      // Vérifier si l'exercice existe
      const exercice = await db.getById('exercices', exerciceId);
      if (!exercice) {
        return res.status(404).json({ message: 'Exercice non trouvé' });
      }
      
      // Si c'est un professeur, vérifier les permissions
      if (userRole === 'professeur') {
        // Si le professeur est le créateur de l'exercice
        const isCreator = exercice.professeurId === userId;
        
        // Ou si le professeur enseigne la matière dans cette classe
        const classe = await db.getById('classes', exercice.classeId);
        const matiere = classe?.matieres?.find(m => m.id === exercice.matiereId);
        const enseigneMatiere = matiere && matiere.professeurId === userId;
        
        if (!isCreator && !enseigneMatiere) {
          return res.status(403).json({ message: "Vous n'avez pas accès aux soumissions de cet exercice" });
        }
      }
      
      // Récupérer toutes les soumissions pour cet exercice
      const soumissions = await db.find('soumissions', { exerciceId: exerciceId });
      const eleves = await db.getAll('eleves');
      
      // Ajouter le nom de l'élève à chaque soumission
      const soumissionsAvecNomEleve = soumissions.map(soumission => {
        const eleve = eleves.find(e => e.id === soumission.eleveId);
        return {
          ...soumission,
          eleveNom: eleve ? eleve.nom : 'Élève inconnu'
        };
      });
      
      res.json(soumissionsAvecNomEleve);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Dans ExerciceController.js
  static async getExercicesForClasse(req, res) {
    try {
      const { classeId } = req.params;
      const { eleveId, userId, userRole } = req.query;
      
      console.log('Récupération des exercices pour la classe:', classeId);
      console.log('Paramètres:', { eleveId, userId, userRole });
      
      // Récupérer tous les exercices pour cette classe
      const exercices = await db.find('exercices', { classeId: classeId });
      
      // Si c'est un élève, enrichir les données avec les informations de soumission
      if (userRole === 'eleve') {
        // Utilisez userId si eleveId n'est pas fourni
        const studentId = eleveId || userId;
        
        console.log('ID de l\'élève pour la recherche de soumissions:', studentId);
        
        // Récupérer toutes les soumissions de cet élève
        const soumissions = await db.find('soumissions', { eleveId: studentId });
        
        // Enrichir les exercices avec les informations de soumission
        const exercicesEnrichis = exercices.map(exercice => {
          // Trouver la soumission de cet élève pour cet exercice
          const soumission = soumissions.find(s => s.exerciceId === exercice.id);
          
          console.log(`Soumission trouvée pour exercice ${exercice.id}:`, soumission || 'Aucune');
          
          // Retourner l'exercice avec les informations de soumission
          return {
            ...exercice,
            soumis: !!soumission,
            filepath_soumission: soumission ? soumission.filepath : null,
            dateSoumission: soumission ? soumission.dateSoumission : null,
            note: soumission ? soumission.note : null,
            commentaire: soumission ? soumission.commentaire : null,
            dateNotation: soumission ? soumission.dateNotation : null
          };
        });
        
        return res.json(exercicesEnrichis);
      }
      
      res.json(exercices);
    } catch (error) {
      console.error('Erreur dans getExercicesForClasse:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async downloadSoumission(req, res) {
    try {
      const { soumissionId } = req.params;
      
      const soumission = await db.getById('soumissions', soumissionId);
      
      if (!soumission) {
        return res.status(404).json({ message: 'Soumission non trouvée' });
      }
      
      // Vérifier si le fichier existe
      const filePath = path.join(__dirname, '..', soumission.filepath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichier non trouvé' });
      }
      
      // Générer un nom de fichier pour le téléchargement
      const eleve = await db.getById('eleves', soumission.eleveId);
      const exercice = await db.getById('exercices', soumission.exerciceId);
      
      let fileName = `soumission_${soumissionId}`;
      if (eleve) fileName = `${eleve.nom}_`;
      if (exercice) fileName += exercice.titre;
      
      // Extension du fichier
      const extension = path.extname(soumission.filepath);
      fileName += extension;
      
      res.download(filePath, fileName);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getExerciceDetails(req, res) {
    try {
      const { exerciceId } = req.params;
      
      const exercice = await db.getById('exercices', exerciceId);
      if (!exercice) {
        return res.status(404).json({ message: 'Exercice non trouvé' });
      }
      
      res.json(exercice);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async updateExercice(req, res) {
    try {
      const { exerciceId } = req.params;
      const { titre, description, dateLimit } = req.body;
      
      const exercice = await db.getById('exercices', exerciceId);
      
      if (!exercice) {
        return res.status(404).json({ message: 'Exercice non trouvé' });
      }
      
      const updates = {
        titre: titre || exercice.titre,
        description: description || exercice.description,
        dateLimit: dateLimit || exercice.dateLimit,
        dateModification: new Date().toISOString()
      };
      
      await db.update('exercices', exerciceId, updates);
      
      // Récupérer l'exercice mis à jour
      const updatedExercice = await db.getById('exercices', exerciceId);
      
      res.json(updatedExercice);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }
  
  static async deleteExercice(req, res) {
    try {
      const { exerciceId } = req.params;
      
      const exercice = await db.getById('exercices', exerciceId);
      if (!exercice) {
        return res.status(404).json({ message: 'Exercice non trouvé' });
      }
      
      // Supprimer le fichier physique
      const filePath = path.join(__dirname, '..', exercice.filepath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Supprimer les soumissions associées
      const soumissions = await db.find('soumissions', { exerciceId: exerciceId });
      for (const soumission of soumissions) {
        await db.delete('soumissions', soumission.id);
      }
      
      // Supprimer l'exercice
      await db.delete('exercices', exerciceId);
      
      res.json({ message: 'Exercice supprimé avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async uploadExercice(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier fourni' });
      }

      const { classeId, matiereId, titre, description, dateLimit, professeurId } = req.body;
      
      // Validation des champs obligatoires
      if (!classeId || !matiereId || !titre || !professeurId) {
        console.error('Champs manquants:', { classeId, matiereId, titre, professeurId });
        return res.status(400).json({ 
          message: 'Données obligatoires manquantes (classe, matière, titre ou professeur)'
        });
      }
      
      // Gestion de la date (peut être null)
      let formattedDateLimit = null;
      if (dateLimit) {
        try {
          formattedDateLimit = new Date(dateLimit).toISOString();
        } catch (dateError) {
          console.error('Erreur de format de date:', dateError);
          // Ne pas bloquer la création si la date est incorrecte, utiliser null
        }
      }
      
      // Logs pour déboguer
      console.log('Données exercice:', {
        titre,
        classeId,
        matiereId,
        professeurId,
        dateLimit,
        formattedDateLimit,
        filepath: req.file.path
      });
      
      const newExercice = {
        id: Date.now().toString(),
        titre,
        description: description || '',
        classeId,
        matiereId,
        professeurId,
        filepath: req.file.path,
        dateCreation: new Date().toISOString(),
        dateLimit: formattedDateLimit,
        soumissions: []
      };
      
      await db.insert('exercices', newExercice);
      
      res.status(201).json(newExercice);
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'exercice:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async soumettreExercice(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier fourni' });
      }

      const { exerciceId, eleveId } = req.body;
      
      const exercice = await db.getById('exercices', exerciceId);
      if (!exercice) {
        return res.status(404).json({ message: 'Exercice non trouvé' });
      }

      const nouvelleSoumission = {
        id: Date.now().toString(),
        exerciceId,
        eleveId,
        filepath: req.file.path,
        dateSoumission: new Date().toISOString(),
        status: 'en_attente',
        note: null,
        commentaire: null
      };

      await db.insert('soumissions', nouvelleSoumission);
      
      res.status(201).json(nouvelleSoumission);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getExercicesForEleve(req, res) {
    try {
      const { classeId } = req.params;
      const { userId, userRole } = req.query;
      
      if (userRole !== 'eleve') {
        return res.status(403).json({ message: "Accès réservé aux élèves" });
      }
      
      // Récupérer tous les exercices pour cette classe
      const exercices = await db.find('exercices', { classeId: classeId });
      const soumissions = await db.find('soumissions', { eleveId: userId });
      const classe = await db.getById('classes', classeId);
      
      const exercicesEnrichis = exercices.map(exercice => {
        // Pour chaque exercice, trouver la soumission de cet élève si elle existe
        const soumission = soumissions.find(s => s.exerciceId === exercice.id);
        
        // Trouver la matière pour cet exercice
        const matiere = classe?.matieres?.find(m => m.id === exercice.matiereId);
        
        return {
          ...exercice,
          matiereNom: matiere ? matiere.nom : 'Matière inconnue',
          soumission: soumission || null
        };
      });
      
      res.json(exercicesEnrichis);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async noterSoumission(req, res) {
    try {
      const { soumissionId } = req.params;
      const { note, commentaire } = req.body;
      const { userId } = req.query;  // ID du professeur qui note
      
      if (note === undefined) {
        return res.status(400).json({ message: 'La note est requise' });
      }
      
      const noteValue = parseFloat(note);
      if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
        return res.status(400).json({ message: 'La note doit être un nombre entre 0 et 20' });
      }
      
      // Trouver la soumission
      const soumission = await db.getById('soumissions', soumissionId);
      if (!soumission) {
        return res.status(404).json({ message: 'Soumission non trouvée' });
      }
      
      // Mettre à jour la soumission
      const soumissionUpdates = {
        note: noteValue,
        commentaire: commentaire || '',
        professeurId: userId,
        dateNotation: new Date().toISOString()
      };
      
      await db.update('soumissions', soumissionId, soumissionUpdates);
      
      // Trouver l'exercice pour obtenir la matière
      const exercice = await db.getById('exercices', soumission.exerciceId);
      if (!exercice) {
        return res.status(404).json({ message: 'Exercice associé non trouvé' });
      }
      
      // Vérifier si une note pour cet exercice existe déjà
      const notesExistantes = await db.find('notes', { 
        eleveId: soumission.eleveId, 
        exerciceId: soumission.exerciceId 
      });
      
      // Créer l'objet note - UTILISER NOTE AU LIEU DE VALEUR
      const noteObj = {
        id: notesExistantes.length > 0 ? notesExistantes[0].id : Date.now().toString(),
        eleveId: soumission.eleveId,
        exerciceId: soumission.exerciceId,
        matiereId: exercice.matiereId,
        professeurId: userId,
        note: noteValue,  // IMPORTANT: Utiliser "note" et non "valeur" pour être cohérent
        commentaire: commentaire || '',
        type: 'exercice',
        date: new Date().toISOString()
      };
      
      if (notesExistantes.length > 0) {
        // Mettre à jour la note existante
        await db.update('notes', noteObj.id, noteObj);
      } else {
        // Ajouter une nouvelle note
        await db.insert('notes', noteObj);
      }
      
      // Récupérer la soumission mise à jour
      const updatedSoumission = await db.getById('soumissions', soumissionId);
      
      res.json(updatedSoumission);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ExerciceController;