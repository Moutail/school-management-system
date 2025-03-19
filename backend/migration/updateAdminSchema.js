// migration/updateAdminSchema.js
const fs = require('fs');
const path = require('path');

// Fonction pour migrer les données des administrateurs
async function migrateAdminData() {
  try {
    console.log('Début de la migration des données administrateurs...');
    
    // Lire le fichier de base de données
    const dbPath = path.join(__dirname, '../db.json');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // Vérifier si la collection des admins existe
    if (!data.admins) {
      console.log('Aucun administrateur trouvé, création de la structure...');
      data.admins = [];
    }
    
    // Parcourir tous les administrateurs et ajouter les nouveaux champs
    let hasChanges = false;
    
    for (let i = 0; i < data.admins.length; i++) {
      const admin = data.admins[i];
      
      // Ajouter le champ isPrimary s'il n'existe pas
      if (admin.isPrimary === undefined) {
        admin.isPrimary = admin.id === '1';
        hasChanges = true;
      }
      
      // Ajouter la date de création si elle n'existe pas
      if (!admin.dateCreation) {
        admin.dateCreation = new Date().toISOString();
        hasChanges = true;
      }
      
      // Pour les administrateurs non-principaux, ajouter createdBy s'il n'existe pas
      if (!admin.isPrimary && !admin.createdBy) {
        admin.createdBy = '1'; // Par défaut, créé par l'admin principal
        hasChanges = true;
      }
    }
    
    // S'assurer que l'administrateur principal existe
    const primaryAdminExists = data.admins.some(admin => admin.isPrimary === true || admin.id === '1');
    
    if (!primaryAdminExists) {
      console.log('Aucun administrateur principal trouvé, création d\'un administrateur principal par défaut...');
      
      data.admins.push({
        id: '1',
        nom: 'Admin Principal',
        email: 'admin@example.com',
        password: 'adminpass123', // À changer dans un environnement de production
        role: 'admin',
        status: 'actif',
        isPrimary: true,
        dateCreation: new Date().toISOString()
      });
      
      hasChanges = true;
    }
    
    // Sauvegarder les changements si nécessaire
    if (hasChanges) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      console.log('Migration des données administrateurs terminée avec succès.');
    } else {
      console.log('Aucune modification nécessaire, les données sont à jour.');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la migration des données:', error);
    return false;
  }
}

// Exécuter la migration
migrateAdminData()
  .then(success => {
    if (success) {
      console.log('Migration terminée avec succès.');
      process.exit(0);
    } else {
      console.error('Échec de la migration.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Erreur non gérée:', err);
    process.exit(1);
  });