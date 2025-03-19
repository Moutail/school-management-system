// controllers/FraisController.js
const db = require('../db/dbController');

class FraisController {
    static async getFraisForEleve(req, res) {
        try {
          const { eleveId } = req.params;
          console.log(`Récupération des frais pour l'élève ${eleveId}`);
          
          // Vérifier si l'élève existe
          const eleve = await db.getById('eleves', eleveId);
          if (!eleve) {
            console.log('Élève non trouvé');
            return res.status(404).json({ message: 'Élève non trouvé' });
          }
          
          // Chercher les frais dans la collection fraisScolarite
          const fraisCollection = await db.find('fraisScolarite', { eleveId });
          const fraisSeparate = fraisCollection.length > 0 ? fraisCollection[0] : null;
          
          // Si on a des frais dans la collection séparée, les utiliser
          if (fraisSeparate) {
            console.log('Frais trouvés dans la collection séparée:', fraisSeparate);
            return res.json(fraisSeparate);
          }
          
          // Sinon, utiliser les frais depuis l'objet élève s'ils existent
          if (eleve.fraisScolarite) {
            console.log('Frais trouvés dans l\'objet élève:', eleve.fraisScolarite);
            
            // IMPORTANT: Assurez-vous que les données de frais ont le bon format
            const fraisFormatted = {
              id: `frais_${eleveId}_${Date.now()}`,
              eleveId: eleveId,
              montantTotal: eleve.fraisScolarite.montantTotal || 0,
              montantPaye: eleve.fraisScolarite.montantPaye || 0,
              statut: eleve.fraisScolarite.statut || 'Non défini',
              dateCreation: new Date().toISOString(),
              commentaire: ""
            };
            
            // Ajouter ces frais formatés à la collection
            await db.insert('fraisScolarite', fraisFormatted);
            
            return res.json(fraisFormatted);
          }
          
          // Si aucun frais n'existe, créer une structure par défaut
          console.log('Aucun frais trouvé, création d\'une structure par défaut');
          const defaultFrais = {
            id: `frais_${eleveId}_${Date.now()}`,
            eleveId: eleveId,
            montantTotal: 0,
            montantPaye: 0,
            statut: 'Non défini',
            dateCreation: new Date().toISOString(),
            commentaire: ""
          };
          
          // Ajouter ces frais par défaut à la collection
          await db.insert('fraisScolarite', defaultFrais);
          
          return res.json(defaultFrais);
        } catch (error) {
          console.error('Erreur dans getFraisForEleve:', error);
          res.status(500).json({ message: error.message });
        }
      }

  static async updateFraisEleve(req, res) {
    try {
      const { eleveId } = req.params;
      const { montantPaye, nouveauTotal, commentaire } = req.body;
      
      console.log('updateFraisEleve - Données reçues:', { 
        eleveId, 
        montantPaye, 
        nouveauTotal, 
        commentaire 
      });
      
      // Vérifier si l'élève existe
      const eleve = await db.getById('eleves', eleveId);
      if (!eleve) {
        console.log('Élève non trouvé');
        return res.status(404).json({ message: 'Élève non trouvé' });
      }
      
      // Chercher les frais existants
      const fraisCollection = await db.find('fraisScolarite', { eleveId });
      const fraisExiste = fraisCollection.length > 0;
      let frais;
      
      // Si les frais existent déjà dans la collection
      if (fraisExiste) {
        console.log('Frais existants mis à jour dans la collection séparée');
        frais = fraisCollection[0];
        
        // Préparer les mises à jour
        const updates = {};
        
        // Mettre à jour le montant payé si fourni
        if (montantPaye !== undefined) {
          updates.montantPaye = parseFloat(montantPaye);
        }
        
        // Mettre à jour le montant total si fourni
        if (nouveauTotal !== undefined) {
          updates.montantTotal = parseFloat(nouveauTotal);
        }
        
        // Mise à jour du commentaire si fourni
        if (commentaire !== undefined) {
          updates.commentaire = commentaire;
        }
        
        // Ajouter la date de modification
        updates.dateModification = new Date().toISOString();
        
        // Calculer le statut en fonction des montants
        const totalAmount = nouveauTotal !== undefined 
          ? parseFloat(nouveauTotal) 
          : frais.montantTotal;
          
        const paidAmount = montantPaye !== undefined 
          ? parseFloat(montantPaye) 
          : frais.montantPaye;
        
        if (totalAmount > 0) {
          if (paidAmount >= totalAmount) {
            updates.statut = 'complet';
          } else if (paidAmount > 0) {
            updates.statut = 'partiel';
          } else {
            updates.statut = 'impayé';
          }
        } else {
          updates.statut = 'Non défini';
        }
        
        // Appliquer les mises à jour
        await db.update('fraisScolarite', frais.id, updates);
        
        // Récupérer les frais mis à jour
        frais = (await db.find('fraisScolarite', { eleveId }))[0];
      } 
      // Sinon, créer un nouvel enregistrement
      else {
        console.log('Création d\'un nouvel enregistrement de frais');
        // Obtenir les données de frais de l'objet élève (si disponibles)
        const eleveFrais = eleve.fraisScolarite || {};
        
        frais = {
          id: `frais_${eleveId}_${Date.now()}`,
          eleveId,
          montantPaye: montantPaye !== undefined ? parseFloat(montantPaye) : 
                      (eleveFrais.montantPaye || 0),
          montantTotal: nouveauTotal !== undefined ? parseFloat(nouveauTotal) : 
                      (eleveFrais.montantTotal || 0),
          statut: 'impayé',
          commentaire: commentaire || '',
          dateCreation: new Date().toISOString()
        };
        
        // Calculer le statut en fonction des montants
        if (frais.montantTotal > 0) {
          if (frais.montantPaye >= frais.montantTotal) {
            frais.statut = 'complet';
          } else if (frais.montantPaye > 0) {
            frais.statut = 'partiel';
          } else {
            frais.statut = 'impayé';
          }
        } else {
          frais.statut = 'Non défini';
        }
        
        // Insérer les nouveaux frais
        await db.insert('fraisScolarite', frais);
      }
      
      console.log('Frais mis à jour:', frais);
      
      // Synchroniser avec l'objet élève
      const eleveFraisUpdate = {
        fraisScolarite: {
          montantTotal: frais.montantTotal,
          montantPaye: frais.montantPaye,
          statut: frais.statut,
          dernierPaiement: new Date().toISOString()
        }
      };
      
      // Préserver l'échéancier si l'élève en avait un
      if (eleve.fraisScolarite && eleve.fraisScolarite.echeancier) {
        eleveFraisUpdate.fraisScolarite.echeancier = eleve.fraisScolarite.echeancier;
        frais.echeancier = eleve.fraisScolarite.echeancier;
      }
      
      // Mettre à jour l'élève
      await db.update('eleves', eleveId, eleveFraisUpdate);
      
      // Retourner les frais mis à jour
      res.json(frais);
    } catch (error) {
      console.error('Erreur dans updateFraisEleve:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = FraisController;