// db/dbController.js
const path = require('path');
const db = require('./mongoAdapter');
const fs = require('fs').promises;

// Chemin vers le fichier JSON de sauvegarde
const JSON_FILE_PATH = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../data/db.json')
  : path.join(__dirname, '../db.json');

// Classe pour gérer l'accès à la base de données
class DbController {
  constructor() {
    this.initialized = false;
    this.jsonMode = false;
    this.jsonData = null;
  }

// Modification de la méthode init dans dbController.js
async init() {
  if (this.initialized) return;
  
  try {
    // Essayer de se connecter à MongoDB
    await db.connect();
    await db.initCollections();
    
    // Vérifier si la migration est nécessaire (premier démarrage)
    const adminsCount = await db.getAll('admins');
    if (adminsCount.length === 0) {
      console.log('Aucune donnée trouvée dans MongoDB, migration nécessaire');
      // En production, vous pourriez vouloir éviter la migration automatique
      if (process.env.NODE_ENV !== 'production') {
        await this.migrateFromJson();
      }
    }
    
    this.initialized = true;
    this.jsonMode = false;
    console.log('DbController initialisé en mode MongoDB');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de MongoDB:', error);
    
    // En production, vous pourriez vouloir échouer au lieu de fallback au JSON
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Impossible de se connecter à MongoDB en production: ' + error.message);
    }
    
    await this.fallbackToJson();
  }
}
  
  // Méthode spéciale pour les settings - toujours utiliser MongoDB
  async getSettings() {
    try {
      // Vérifier si les settings existent dans MongoDB
      const settingsCollection = db.db.collection('settings');
      const settings = await settingsCollection.findOne({});
      
      if (settings) {
        console.log("Paramètres trouvés dans MongoDB");
        
        // S'assurer que passwordPolicy existe
        if (!settings.passwordPolicy) {
          settings.passwordPolicy = {
            minLength: 8,
            requireNumbers: true,
            requireSpecialChars: true,
            requireUppercase: true
          };
          
          // Mettre à jour dans MongoDB
          await settingsCollection.updateOne(
            { _id: settings._id }, 
            { $set: { passwordPolicy: settings.passwordPolicy } }
          );
        }
        
        return settings;
      } else {
        console.log("Création de paramètres par défaut dans MongoDB");
        
        // Créer des paramètres par défaut
        const defaultSettings = {
          id: '1',
          anneeScolaire: new Date().getFullYear().toString(),
          montantScolarite: 0,
          dateRentree: null,
          nomEcole: "Mon École",
          adresseEcole: "",
          contactEcole: "",
          logoEcole: null,
          passwordPolicy: {
            minLength: 8,
            requireNumbers: true,
            requireSpecialChars: true,
            requireUppercase: true
          }
        };
        
        // Insérer dans MongoDB
        await settingsCollection.insertOne(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres:", error);
      
      // Fallback aux paramètres JSON
      if (this.jsonData && this.jsonData.settings) {
        const settings = this.jsonData.settings;
        
        // S'assurer que passwordPolicy existe
        if (!settings.passwordPolicy) {
          settings.passwordPolicy = {
            minLength: 8,
            requireNumbers: true,
            requireSpecialChars: true,
            requireUppercase: true
          };
        }
        
        return settings;
      }
      
      // Dernier recours - retourner des paramètres par défaut
      return {
        id: '1',
        anneeScolaire: new Date().getFullYear().toString(),
        montantScolarite: 0,
        dateRentree: null,
        nomEcole: "Mon École",
        adresseEcole: "",
        contactEcole: "",
        logoEcole: null,
        passwordPolicy: {
          minLength: 8,
          requireNumbers: true,
          requireSpecialChars: true,
          requireUppercase: true
        }
      };
    }
  }
  
  // Méthode spéciale pour les messages - toujours utiliser JSON
  async getMessages(userId, userRole) {
    await this.init();
    
    try {
      // Toujours utiliser le fichier JSON pour les messages
      if (this.jsonData && this.jsonData.messages) {
        return this.jsonData.messages.filter(msg => 
          (msg.senderId === userId && msg.senderRole === userRole) || 
          (msg.receiverId === userId && msg.receiverRole === userRole)
        );
      }
      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
      return [];
    }
  }

  // Migration des données de JSON vers MongoDB
  async migrateFromJson() {
    try {
      const result = await db.migrateJsonToMongo(JSON_FILE_PATH);
      if (result.success) {
        console.log('Migration de JSON vers MongoDB réussie');
      } else {
        console.error('Échec de la migration:', result.error);
        await this.fallbackToJson();
      }
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      await this.fallbackToJson();
    }
  }

  // Retour au mode JSON en cas d'échec de MongoDB
  async fallbackToJson() {
    console.log('Passage en mode JSON');
    try {
      this.jsonData = JSON.parse(await fs.readFile(JSON_FILE_PATH, 'utf8'));
      
      // Vérifiez si la propriété messages existe
      console.log("Propriétés disponibles dans le JSON:", Object.keys(this.jsonData));
      console.log("Nombre de messages dans le JSON:", 
        this.jsonData.messages ? this.jsonData.messages.length : 0);
      
      if (this.jsonData.messages && this.jsonData.messages.length > 0) {
        console.log("Exemple de message:", this.jsonData.messages[0]);
      }
      
      this.jsonMode = true;
      this.initialized = true;
      console.log('Mode JSON activé avec succès');
    } catch (error) {
      console.error('Erreur critique: impossible de charger le JSON de secours:', error);
      throw new Error('Impossible d\'accéder aux données');
    }
}

  // Sauvegarde des données au format JSON
  async saveJsonBackup() {
    if (!this.jsonMode) {
      try {
        // Récupérer toutes les données de MongoDB
        const data = {};
        const collections = ['admins', 'professeurs', 'eleves', 'parents', 'classes', 
                            'cours', 'exercices', 'notes', 'messages', 'fraisScolarite', 
                            'permissions', 'soumissions', 'adminLogs', 'settings'];
        
        for (const collection of collections) {
          data[collection] = await db.getAll(collection);
        }
        
        // Sauvegarder dans le fichier JSON
        await fs.writeFile(
          JSON_FILE_PATH + '.backup-' + new Date().toISOString().replace(/:/g, '-'),
          JSON.stringify(data, null, 2),
          'utf8'
        );
        console.log('Sauvegarde JSON créée avec succès');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde JSON:', error);
      }
    }
  }

  // Méthodes d'accès aux données qui fonctionnent dans les deux modes
  // Dans dbController.js
async getAll(collection) {
  await this.init();
  
  // Collections qui marchent bien en mode MongoDB
  const mongoCandidates = ['settings', 'admins', 'professeurs'];
  
  // Collections qui marchent mieux en JSON pour le moment
  const jsonCandidates = ['messages', 'cours'];
  
  if (!this.jsonMode && mongoCandidates.includes(collection)) {
    try {
      return await db.getAll(collection);
    } catch (error) {
      console.warn(`Erreur MongoDB pour ${collection}, fallback à JSON:`, error);
    }
  }
  
  // Utiliser JSON pour certaines collections ou en cas d'erreur MongoDB
  if (this.jsonMode || jsonCandidates.includes(collection)) {
    // Vérifier si la collection existe dans les données JSON
    if (this.jsonData && this.jsonData[collection]) {
      return this.jsonData[collection];
    } else {
      console.warn(`Collection ${collection} non trouvée dans le mode JSON, retour tableau vide`);
      return [];
    }
  }
  
  // Par défaut, utiliser MongoDB
  try {
    return await db.getAll(collection);
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${collection} depuis MongoDB:`, error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
}

  async getById(collection, id) {
    await this.init();
    
    if (this.jsonMode) {
      const items = this.jsonData[collection] || [];
      return items.find(item => item.id === id) || null;
    } else {
      return await db.getById(collection, id);
    }
  }

  async insert(collection, data) {
    await this.init();
    
    if (this.jsonMode) {
      if (!this.jsonData[collection]) {
        this.jsonData[collection] = [];
      }
      
      // Générer un ID si nécessaire
      if (!data.id) {
        data.id = Date.now().toString();
      }
      
      this.jsonData[collection].push(data);
      await this.saveJson();
      return { insertedId: data.id };
    } else {
      return await db.insert(collection, data);
    }
  }

  async update(collection, id, data) {
    await this.init();
    
    if (this.jsonMode) {
      if (!this.jsonData[collection]) {
        return { modifiedCount: 0 };
      }
      
      const index = this.jsonData[collection].findIndex(item => item.id === id);
      if (index === -1) {
        return { modifiedCount: 0 };
      }
      
      // Mettre à jour l'objet
      this.jsonData[collection][index] = { 
        ...this.jsonData[collection][index], 
        ...data 
      };
      
      await this.saveJson();
      return { modifiedCount: 1 };
    } else {
      return await db.update(collection, id, data);
    }
  }

  async delete(collection, id) {
    await this.init();
    
    if (this.jsonMode) {
      if (!this.jsonData[collection]) {
        return { deletedCount: 0 };
      }
      
      const initialLength = this.jsonData[collection].length;
      this.jsonData[collection] = this.jsonData[collection].filter(item => item.id !== id);
      
      const deletedCount = initialLength - this.jsonData[collection].length;
      if (deletedCount > 0) {
        await this.saveJson();
      }
      
      return { deletedCount };
    } else {
      return await db.delete(collection, id);
    }
  }

  async find(collection, filter) {
    await this.init();
    
    if (this.jsonMode) {
      if (!this.jsonData[collection]) {
        console.log(`Collection ${collection} non trouvée en mode JSON`);
        return [];
      }
      
      // Log pour débogage
      console.log(`Recherche dans ${collection} avec filtre:`, filter);
      
      // Cas spécial pour $or
      if (filter.$or) {
        console.log("Traitement d'une requête $or en mode JSON");
        
        return this.jsonData[collection].filter(item => {
          // Vérifier si au moins une condition est satisfaite
          return filter.$or.some(condition => {
            for (const [key, value] of Object.entries(condition)) {
              if (item[key] !== value) {
                return false;
              }
            }
            return true;
          });
        });
      }
      
      // Filtrage simple pour le mode JSON
      return this.jsonData[collection].filter(item => {
        for (const [key, value] of Object.entries(filter)) {
          if (item[key] !== value) {
            return false;
          }
        }
        return true;
      });
    } else {
      return await db.find(collection, filter);
    }
}

// Ajoutez cette méthode à dbController.js
async findMessages(userId, userRole) {
    await this.init();
    
    if (this.jsonMode) {
      if (!this.jsonData.messages) {
        console.log("Aucun message trouvé dans les données JSON");
        return [];
      }
      
      // Filtrage manuel des messages
      const userMessages = this.jsonData.messages.filter(msg => 
        (msg.receiverId === userId && msg.receiverRole === userRole) || 
        (msg.senderId === userId && msg.senderRole === userRole)
      );
      
      console.log(`Messages trouvés pour ${userRole} ${userId} (mode JSON): ${userMessages.length}`);
      return userMessages;
    } else {
      try {
        // Mode MongoDB
        return await db.find('messages', {
          $or: [
            { receiverId: userId, receiverRole: userRole },
            { senderId: userId, senderRole: userRole }
          ]
        });
      } catch (error) {
        console.error("Erreur lors de la recherche des messages en mode MongoDB:", error);
        return [];
      }
    }
  }

  // Ajoutez à un contrôleur existant ou créez un nouveau contrôleur
static async getDiagnostic(req, res) {
    try {
      const dbMode = db.jsonMode ? "JSON" : "MongoDB";
      const stats = {};
      
      // Statistiques pour chaque collection
      const collections = ['admins', 'professeurs', 'eleves', 'parents', 'classes', 'messages'];
      
      for (const collection of collections) {
        if (db.jsonMode) {
          stats[collection] = db.jsonData[collection] ? db.jsonData[collection].length : 0;
        } else {
          stats[collection] = await db.collections[collection].countDocuments();
        }
      }
      
      // Exemples de données
      const examples = {};
      for (const collection of collections) {
        if (db.jsonMode && db.jsonData[collection] && db.jsonData[collection].length > 0) {
          examples[collection] = db.jsonData[collection][0];
        } else if (!db.jsonMode) {
          examples[collection] = await db.collections[collection].findOne();
        }
      }
      
      res.json({
        mode: dbMode,
        stats,
        examples,
        jsonFile: JSON_FILE_PATH
      });
    } catch (error) {
      res.status(500).json({ error: error.toString() });
    }
  }

  // Sauvegarde du fichier JSON
  async saveJson() {
    if (this.jsonMode) {
      try {
        await fs.writeFile(JSON_FILE_PATH, JSON.stringify(this.jsonData, null, 2), 'utf8');
        console.log('Fichier JSON sauvegardé avec succès');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du fichier JSON:', error);
      }
    }
  }

  // Méthodes spécifiques correspondant à votre API actuelle
  async getEleves() {
    return await this.getAll('eleves');
  }

  async getProfesseurs() {
    return await this.getAll('professeurs');
  }

  async getClasses() {
    return await this.getAll('classes');
  }

  async getCours() {
    return await this.getAll('cours');
  }

  async getMessages(userId, userRole) {
    await this.init();
    
    if (this.jsonMode) {
      if (!this.jsonData.messages) {
        return [];
      }
      
      return this.jsonData.messages.filter(msg => 
        (msg.senderId === userId && msg.senderRole === userRole) || 
        (msg.receiverId === userId && msg.receiverRole === userRole)
      );
    } else {
      return await db.getMessages(userId, userRole);
    }
  }

  async getAdminSettings() {
    await this.init();
    
    if (this.jsonMode) {
      return this.jsonData.settings || {};
    } else {
      return await db.getAdminSettings();
    }
  }
  /**
 * Restaure les données de sauvegarde dans la base de données
 * @param {Object} backupData Les données de sauvegarde à restaurer
 * @returns {Object} Informations sur la restauration
 */
async restoreFromBackup(backupData) {
    try {
      await this.init();
      
      // Statistiques pour le rapport
      const stats = {
        collections: {},
        totalDocuments: 0,
        success: true
      };
      
      // Collections à restaurer
      const collections = [
        'admins',
        'professeurs',
        'eleves',
        'parents',
        'classes',
        'cours',
        'exercices',
        'notes',
        'messages',
        'fraisScolarite',
        'permissions',
        'soumissions',
        'adminLogs'
      ];
      
      // Traiter les paramètres séparément car c'est un objet unique
      if (backupData.settings) {
        if (this.jsonMode) {
          this.jsonData.settings = backupData.settings;
        } else {
          // Vider la collection settings
          await this.db.collection('settings').deleteMany({});
          
          // Insérer les nouveaux paramètres
          const settingsData = Array.isArray(backupData.settings) ? 
            backupData.settings : [backupData.settings];
          
          if (settingsData.length > 0) {
            await this.db.collection('settings').insertMany(settingsData);
            stats.collections['settings'] = settingsData.length;
            stats.totalDocuments += settingsData.length;
          }
        }
      }
      
      // Restaurer chaque collection
      for (const collection of collections) {
        if (backupData[collection] && Array.isArray(backupData[collection])) {
          if (this.jsonMode) {
            // Mode JSON - simplement remplacer les données
            this.jsonData[collection] = backupData[collection];
          } else {
            // Mode MongoDB
            try {
              // Vider la collection actuelle
              await this.db.collection(collection).deleteMany({});
              
              // Insérer les nouvelles données si elles existent
              if (backupData[collection].length > 0) {
                await this.db.collection(collection).insertMany(backupData[collection]);
              }
              
              // Mettre à jour les statistiques
              stats.collections[collection] = backupData[collection].length;
              stats.totalDocuments += backupData[collection].length;
            } catch (error) {
              console.error(`Erreur lors de la restauration de la collection ${collection}:`, error);
              stats.collections[collection] = { error: error.message };
              stats.success = false;
            }
          }
        }
      }
      
      // En mode JSON, sauvegarder le fichier
      if (this.jsonMode) {
        await this.saveJson();
      }
      
      // Ajouter un timestamp à la réponse
      stats.timestamp = new Date().toISOString();
      
      return stats;
    } catch (error) {
      console.error('Erreur lors de la restauration de la sauvegarde:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new DbController();
