// fixDatabase.js
// Script pour vérifier et corriger la cohérence de la base de données

const fs = require('fs');
const path = require('path');

// Chemin vers votre fichier de base de données
const dbPath = 'db.json';

try {
  console.log('Vérification et correction de la base de données...');
  const rawData = fs.readFileSync(dbPath);
  const data = JSON.parse(rawData);
  
  let modified = false;
  
  // Vérifier si la structure de base est complète
  if (!data.cours) data.cours = [];
  if (!data.eleves) data.eleves = [];
  if (!data.parents) data.parents = [];
  if (!data.classes) data.classes = [];
  if (!data.notes) data.notes = [];
  if (!data.exercices) data.exercices = [];
  if (!data.soumissions) data.soumissions = [];
  
  // 1. Vérification de la cohérence des relations parent-élève
  console.log('Vérification des relations parent-élève...');
  
  // Pour chaque parent, s'assurer que les élèves existent et ont un parentId correct
  data.parents.forEach(parent => {
    if (!parent.elevesIds) parent.elevesIds = [];
    
    parent.elevesIds.forEach(eleveId => {
      const eleveIndex = data.eleves.findIndex(e => e.id === eleveId);
      if (eleveIndex !== -1) {
        // L'élève existe, vérifier son parentId
        if (data.eleves[eleveIndex].parentId !== parent.id) {
          console.log(`Correction: Ajout de parentId ${parent.id} à l'élève ${eleveId}`);
          data.eleves[eleveIndex].parentId = parent.id;
          modified = true;
        }
      } else {
        // L'élève n'existe pas, le retirer de la liste
        console.log(`Élève ${eleveId} non trouvé pour le parent ${parent.id}, retrait de la liste`);
        parent.elevesIds = parent.elevesIds.filter(id => id !== eleveId);
        modified = true;
      }
    });
  });
  
  // Pour chaque élève avec un parentId, s'assurer que le parent existe et a cet élève dans sa liste
  data.eleves.forEach(eleve => {
    if (eleve.parentId) {
      const parentIndex = data.parents.findIndex(p => p.id === eleve.parentId);
      if (parentIndex !== -1) {
        // Le parent existe, vérifier si l'élève est dans sa liste
        if (!data.parents[parentIndex].elevesIds) {
          data.parents[parentIndex].elevesIds = [];
        }
        
        if (!data.parents[parentIndex].elevesIds.includes(eleve.id)) {
          console.log(`Correction: Ajout de l'élève ${eleve.id} à la liste du parent ${eleve.parentId}`);
          data.parents[parentIndex].elevesIds.push(eleve.id);
          modified = true;
        }
      } else {
        // Le parent n'existe pas, supprimer le parentId
        console.log(`Parent ${eleve.parentId} non trouvé pour l'élève ${eleve.id}, suppression du parentId`);
        delete eleve.parentId;
        modified = true;
      }
    }
  });
  
  // 2. Vérification de la cohérence des classes
  console.log('Vérification des classes...');
  
  // Pour chaque élève, vérifier que sa classe existe
  data.eleves.forEach(eleve => {
    if (eleve.classeId) {
      const classeExists = data.classes.some(c => c.id === eleve.classeId);
      if (!classeExists) {
        console.log(`Classe ${eleve.classeId} non trouvée pour l'élève ${eleve.id}`);
        // Assigner l'élève à la première classe disponible ou supprimer le classeId
        if (data.classes.length > 0) {
          console.log(`Réassignation de l'élève ${eleve.id} à la classe ${data.classes[0].id}`);
          eleve.classeId = data.classes[0].id;
        } else {
          console.log(`Suppression du classeId pour l'élève ${eleve.id}`);
          delete eleve.classeId;
        }
        modified = true;
      }
    }
  });
  
  // 3. Vérification de la cohérence des cours
  console.log('Vérification des cours...');
  
  data.cours.forEach(cours => {
    // Vérifier que la classe du cours existe
    if (cours.classeId) {
      const classeExists = data.classes.some(c => c.id === cours.classeId);
      if (!classeExists) {
        console.log(`Classe ${cours.classeId} non trouvée pour le cours ${cours.id}`);
        // Si la classe n'existe pas, associer ce cours à la première classe disponible
        if (data.classes.length > 0) {
          console.log(`Réassignation du cours ${cours.id} à la classe ${data.classes[0].id}`);
          cours.classeId = data.classes[0].id;
          modified = true;
        }
      }
    } else {
      // Si le cours n'a pas de classeId, lui en assigner un
      if (data.classes.length > 0) {
        console.log(`Cours ${cours.id} sans classe, assignation à la classe ${data.classes[0].id}`);
        cours.classeId = data.classes[0].id;
        modified = true;
      }
    }
  });
  
  // 4. Vérification des matières dans les classes
  console.log('Vérification des matières...');
  
  data.classes.forEach(classe => {
    if (!classe.matieres) {
      classe.matieres = [];
      modified = true;
    }
  });
  
  // Si des modifications ont été apportées, sauvegarder les changements
  if (modified) {
    console.log('Des modifications ont été apportées, sauvegarde de la base de données...');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log('Base de données corrigée avec succès!');
  } else {
    console.log('Aucune correction nécessaire.');
  }
  
} catch (error) {
  console.error('Erreur lors de la vérification de la base de données:', error);
}