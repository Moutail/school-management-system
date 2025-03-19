// controllers/NoteController.js
const db = require('../db/dbController');

class NoteController {
  static async ajouterNote(req, res) {
    try {
      const { eleveId, matiereId, note, commentaire, date, professeurId } = req.body;
      
      if (!eleveId || !matiereId || !note || !professeurId) {
        return res.status(400).json({ message: 'Données manquantes' });
      }
  
      // Vérifier si l'élève existe
      const eleve = await db.getById('eleves', eleveId);
      if (!eleve) {
        return res.status(404).json({ message: 'Élève non trouvé' });
      }
      
      // Vérifier si la classe existe
      const classe = await db.getById('classes', eleve.classeId);
      if (!classe) {
        return res.status(404).json({ message: 'Classe non trouvée' });
      }
      
      // Vérifier si le professeur a le droit d'ajouter une note pour cette matière
      const matiere = classe.matieres?.find(m => m.id === matiereId);
      if (!matiere || matiere.professeurId !== professeurId) {
        return res.status(403).json({ 
          message: "Vous n'avez pas le droit d'ajouter une note pour cette matière."
        });
      }
  
      // Créer une nouvelle note
      const nouvelleNote = {
        id: Date.now().toString(),
        eleveId,
        matiereId,
        professeurId, // Ajouter l'ID du professeur
        note: parseFloat(note),
        date: date || new Date().toISOString(),
        commentaire: commentaire || ''
      };
  
      // Ajouter la note à la collection
      await db.insert('notes', nouvelleNote);
  
      res.status(201).json(nouvelleNote);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getNotesForClasse(req, res) {
    try {
      const { classeId, matiereId } = req.params;
      const { userId, userRole } = req.query;
      
      console.log('Recherche des notes pour:', { classeId, matiereId, userId, userRole });
      
      // Trouver les élèves de la classe
      const eleves = await db.getAll('eleves');
      const elevesClasse = eleves.filter(eleve => eleve.classeId === classeId);
      const elevesIds = elevesClasse.map(eleve => eleve.id);
      
      // Récupérer toutes les notes
      const allNotes = await db.getAll('notes');
      
      // Filtrer les notes
      let notes;
      
      if (matiereId) {
        // Si une matière spécifique est demandée
        notes = allNotes.filter(note => 
          elevesIds.includes(note.eleveId) && 
          note.matiereId === matiereId
        );
      } else if (userRole === 'professeur') {
        // Si aucune matière spécifique n'est demandée et c'est un professeur
        // Trouver toutes les matières enseignées par ce professeur dans cette classe
        const classe = await db.getById('classes', classeId);
        if (!classe || !classe.matieres) {
          return res.status(404).json({ message: 'Classe non trouvée ou sans matières' });
        }
        
        const matieresIds = classe.matieres
          .filter(m => m.professeurId === userId)
          .map(m => m.id);
        
        notes = allNotes.filter(note => 
          elevesIds.includes(note.eleveId) && 
          matieresIds.includes(note.matiereId)
        );
      } else {
        // Pour un admin ou si la matière n'est pas spécifiée
        notes = allNotes.filter(note => elevesIds.includes(note.eleveId));
      }
      
      console.log(`${notes.length} notes trouvées après filtrage`);
      res.json(notes);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getNotesForEleve(req, res) {
    try {
      const { eleveId } = req.params;
      const { userId, userRole } = req.query;
      const matieresEnseignees = req.matieresEnseignees; // Récupérer depuis le middleware
      
      console.log("Recherche des notes pour l'élève:", eleveId);
      console.log("Utilisateur:", userId, userRole);
      console.log("Matières enseignées:", matieresEnseignees);
      
      // Récupérer toutes les notes
      const allNotes = await db.getAll('notes');
      
      // Filtrer les notes pour l'élève
      let notes = allNotes.filter(note => note.eleveId === eleveId);
      console.log(`Nombre total de notes pour l'élève: ${notes.length}`);
  
      // Si c'est un professeur, filtrer uniquement les notes des matières qu'il enseigne
      if (userRole === 'professeur' && matieresEnseignees) {
        const notesFiltrees = notes.filter(note => matieresEnseignees.includes(note.matiereId));
        console.log(`Après filtrage par matières enseignées: ${notesFiltrees.length} notes`);
        notes = notesFiltrees;
      }
  
      // Récupérer toutes les classes pour trouver les informations de matière
      const classes = await db.getAll('classes');
      
      // Ajouter les informations de matière pour chaque note
      const notesAvecDetails = notes.map(note => {
        let matiereInfo = null;
        
        // Chercher la matière dans toutes les classes
        for (const classe of classes) {
          if (classe.matieres) {
            const matiere = classe.matieres.find(m => m.id === note.matiereId);
            if (matiere) {
              matiereInfo = matiere;
              break;
            }
          }
        }
  
        return {
          ...note,
          matiere: matiereInfo ? {
            id: matiereInfo.id,
            nom: matiereInfo.nom
          } : null
        };
      });
  
      res.json(notesAvecDetails);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async supprimerNote(req, res) {
    try {
      const { id } = req.params;
      
      // Vérifier si la note existe
      const note = await db.getById('notes', id);
      if (!note) {
        return res.status(404).json({ message: 'Note non trouvée' });
      }
  
      // Supprimer la note
      await db.delete('notes', id);
  
      res.json({ message: 'Note supprimée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async modifierNote(req, res) {
    try {
      const { id } = req.params;
      const { note, commentaire } = req.body;

      // Vérifier si la note existe
      const existingNote = await db.getById('notes', id);
      if (!existingNote) {
        return res.status(404).json({ message: 'Note non trouvée' });
      }

      // Préparer les données de mise à jour
      const updateData = {
        note: parseFloat(note),
        commentaire,
        dateModification: new Date().toISOString()
      };

      // Mettre à jour la note
      await db.update('notes', id, updateData);

      // Récupérer la note mise à jour
      const updatedNote = await db.getById('notes', id);
      res.json(updatedNote);
    } catch (error) {
      console.error('Erreur lors de la modification de la note:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = NoteController;