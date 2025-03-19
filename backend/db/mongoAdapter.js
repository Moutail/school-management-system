// db/mongoAdapter.js
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'ecoleDB';

class MongoAdapter {
  constructor(uri = MONGODB_URI, dbName = MONGODB_DB) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.collections = {};
    this.jsonData = null;
  }

  // Connexion à MongoDB
  // Dans mongoAdapter.js
async connect() {
    if (!this.isConnected) {
      try {
        // Assurez-vous d'utiliser une URL de connexion valide
        this.client = new MongoClient(this.uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          // Empêcher la fermeture de la connexion
          socketTimeoutMS: 0,
          connectTimeoutMS: 30000,
        });
        
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.isConnected = true;
        console.log('Connecté à MongoDB avec succès');
      } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
        throw error;
      }
    }
    return this.db;
  }

  // Initialiser les collections
  async initCollections() {
    const collections = ['admins', 'professeurs', 'eleves', 'parents', 'classes', 
                         'cours', 'exercices', 'notes', 'messages', 'fraisScolarite', 
                         'permissions', 'soumissions', 'adminLogs', 'settings'];
    
    for (const name of collections) {
      this.collections[name] = this.db.collection(name);
    }
  }

  // Récupérer tous les éléments d'une collection
  async getAll(collectionName) {
    await this.connect();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    return await this.collections[collectionName].find({}).toArray();
  }

  // Récupérer un élément par ID
  async getById(collectionName, id) {
    await this.connect();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    return await this.collections[collectionName].findOne({ id: id });
  }

  // Ajouter un élément
async insert(collectionName, data) {
    await this.connect();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    
    // Assurez-vous que l'ID est une chaîne
    if (data._id) {
      data._id = data._id.toString();
    }
    
    console.log(`Insertion dans ${collectionName}:`, data);
    return await this.collections[collectionName].insertOne(data);
  }

  // Mettre à jour un élément
  async update(collectionName, id, data) {
    await this.connect();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    return await this.collections[collectionName].updateOne(
      { id: id },
      { $set: data }
    );
  }

  // Supprimer un élément
  async delete(collectionName, id) {
    await this.connect();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    return await this.collections[collectionName].deleteOne({ id: id });
  }

  // Rechercher des éléments avec filtres
  async find(collectionName, filter = {}) {
    await this.connect();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    
    console.log(`Exécution de la requête MongoDB: ${collectionName}`, JSON.stringify(filter));
    
    try {
      // Si le filtre contient des opérateurs MongoDB
      if (filter.$or || filter.$and || filter.$not || filter.$nor) {
        // Conversion des opérateurs pour s'assurer qu'ils sont correctement interprétés
        const result = await this.collections[collectionName].find(filter).toArray();
        console.log(`Résultat de la requête avec opérateur: ${result.length} documents`);
        return result;
      } else {
        const result = await this.collections[collectionName].find(filter).toArray();
        console.log(`Résultat de la requête simple: ${result.length} documents`);
        return result;
      }
    } catch (error) {
      console.error(`Erreur lors de la requête ${collectionName}:`, error);
      return [];
    }
  }

  // Dans mongoAdapter.js, ajoutez cette fonction
async migrateSettings() {
    try {
      console.log("Vérification et migration des paramètres...");
      
      // Vérifier si les paramètres existent déjà dans MongoDB
      const existingSettings = await this.collections.settings.find({}).toArray();
      
      if (existingSettings.length === 0) {
        // Lire les paramètres depuis le fichier JSON
        const jsonData = JSON.parse(await fs.readFile(JSON_FILE_PATH, 'utf8'));
        
        if (jsonData.settings) {
          console.log("Migration des paramètres depuis JSON vers MongoDB");
          
          // S'assurer que la politique de mot de passe existe
          if (!jsonData.settings.passwordPolicy) {
            jsonData.settings.passwordPolicy = {
              minLength: 8,
              requireNumbers: true,
              requireSpecialChars: true,
              requireUppercase: true
            };
          }
          
          // Ajouter un ID si nécessaire
          if (!jsonData.settings.id) {
            jsonData.settings.id = '1';
          }
          
          // Insérer dans MongoDB
          await this.collections.settings.insertOne(jsonData.settings);
          console.log("Paramètres migrés avec succès");
        } else {
          // Créer des paramètres par défaut
          console.log("Aucun paramètre trouvé dans JSON, création des paramètres par défaut");
          await this.collections.settings.insertOne({
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
          });
        }
      } else {
        console.log("Paramètres déjà existants dans MongoDB");
        
        // Vérifier si passwordPolicy existe
        const settings = existingSettings[0];
        if (!settings.passwordPolicy) {
          console.log("Ajout de la politique de mot de passe manquante");
          await this.collections.settings.updateOne(
            { _id: settings._id },
            { 
              $set: { 
                passwordPolicy: {
                  minLength: 8,
                  requireNumbers: true,
                  requireSpecialChars: true,
                  requireUppercase: true
                }
              } 
            }
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la migration des paramètres:", error);
      return false;
    }
  }

  // Migration des données JSON vers MongoDB
  async migrateJsonToMongo(jsonFilePath) {
    try {
      console.log('Démarrage de la migration de JSON vers MongoDB...');
      
      // Lire le fichier JSON
      const jsonData = JSON.parse(await fs.readFile(path.resolve(jsonFilePath), 'utf8'));
      this.jsonData = jsonData; // Sauvegarder pour référence

      // Se connecter à MongoDB
      await this.connect();
      await this.initCollections();
      
      // Migrer chaque collection
      for (const [collectionName, data] of Object.entries(jsonData)) {
        if (Array.isArray(data)) {
          // Vérifier si la collection existe déjà
          const existingCount = await this.collections[collectionName].countDocuments();
          if (existingCount === 0) {
            // Insérer les données si la collection est vide
            if (data.length > 0) {
              await this.collections[collectionName].insertMany(data);
              console.log(`Collection ${collectionName}: ${data.length} documents insérés`);
            }
          } else {
            console.log(`Collection ${collectionName} contient déjà ${existingCount} documents, migration ignorée`);
          }
        } else if (typeof data === 'object' && data !== null) {
          // Pour les objets uniques comme 'settings'
          const existingCount = await this.collections[collectionName].countDocuments();
          if (existingCount === 0) {
            await this.collections[collectionName].insertOne(data);
            console.log(`Collection ${collectionName}: objet inséré`);
          } else {
            console.log(`Collection ${collectionName} existe déjà, migration ignorée`);
          }
        }
      }
      
      console.log('Migration terminée avec succès');
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      return { success: false, error: error.message };
    }
  }

  // Mode fallback - si MongoDB n'est pas disponible, revenir au JSON
  async useFallbackJson(jsonFilePath) {
    try {
      console.log('Utilisation du mode fallback avec JSON');
      if (!this.jsonData) {
        this.jsonData = JSON.parse(await fs.readFile(path.resolve(jsonFilePath), 'utf8'));
      }
      return true;
    } catch (error) {
      console.error('Erreur lors du chargement du fichier JSON de secours:', error);
      return false;
    }
  }

  // Méthodes spécifiques qui correspondent à votre API actuelle
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
    await this.connect();
    return await this.collections.messages.find({
      $or: [
        { senderId: userId, senderRole: userRole },
        { receiverId: userId, receiverRole: userRole }
      ]
    }).toArray();
  }

  async getAdminSettings() {
    const settings = await this.getAll('settings');
    return settings.length > 0 ? settings[0] : {};
  }

  // Fermer la connexion
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Connexion MongoDB fermée');
    }
  }
}

module.exports = new MongoAdapter();