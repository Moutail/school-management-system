// controllers/SettingsController.js
const db = require('../db/dbController');
const fs = require('fs');
const path = require('path');

class SettingsController {
    // Dans SettingsController.js
    static async getSettings(req, res) {
        try {
            console.log("Début de getSettings avec:", req.query);

            // Récupérer les paramètres depuis la base de données

            console.log("Paramètres récupérés:", JSON.stringify(settingsArray));
            console.log("Début de getSettings");
            // Récupérer les paramètres depuis la base de données
            const settingsArray = await db.getAll('settings');
            console.log("Paramètres récupérés:", settingsArray);
            // Structure de paramètres par défaut complète
            const defaultSettings = {
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
            
            // Si aucun paramètre n'existe, créer une entrée par défaut
            if (!settingsArray || settingsArray.length === 0) {
                console.log("Aucun paramètre trouvé, création des paramètres par défaut");
                
                // Ajouter un ID pour l'entrée
                const newSettings = {
                    ...defaultSettings,
                    id: '1' // ID simple pour les paramètres
                };
                
                // Insérer dans la base de données
                await db.insert('settings', newSettings);
                
                // Retourner les nouveaux paramètres
                return res.json(newSettings);
            }
            
            // Si les paramètres existent mais n'ont pas de politique de mot de passe
            const settings = settingsArray[0];
            if (!settings.passwordPolicy) {
                console.log("Paramètres trouvés mais sans politique de mot de passe, mise à jour");
                
                // Ajouter la politique par défaut
                settings.passwordPolicy = defaultSettings.passwordPolicy;
                
                // Mettre à jour dans la base de données
                await db.update('settings', settings.id || '1', { 
                    passwordPolicy: settings.passwordPolicy 
                });
            }
            
            // Retourner les paramètres
            res.json(settings);
        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres:', error);
            
            res.status(500).json({ 
                message: 'Erreur lors de la récupération des paramètres',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });

            // En cas d'erreur, retourner les paramètres par défaut
            res.json({
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
    }

    // Nouvelle méthode de diagnostic
static async diagnoseSettings(req, res) {
    try {
        const diagnosis = {
            dbMode: db.jsonMode ? "JSON" : "MongoDB",
            settingsInDB: null,
            settingsInJson: null,
            defaultSettings: {
                passwordPolicy: {
                    minLength: 8,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    requireUppercase: true
                }
            }
        };
        
        // Vérifier dans la DB
        if (!db.jsonMode) {
            try {
                const settingsDB = await db.collections.settings.find({}).toArray();
                diagnosis.settingsInDB = settingsDB;
            } catch (dbError) {
                diagnosis.dbError = dbError.message;
            }
        }
        
        // Vérifier dans le JSON
        if (db.jsonData && db.jsonData.settings) {
            diagnosis.settingsInJson = db.jsonData.settings;
        }
        
        res.json(diagnosis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
    
    static async updateSettings(req, res) {
        try {
            const settingsUpdate = req.body;
            
            // Récupérer les paramètres existants
            const settingsArray = await db.getAll('settings');
            
            if (settingsArray.length === 0) {
                // Créer de nouveaux paramètres s'ils n'existent pas
                const newSettings = {
                    id: '1', // ID standard pour les paramètres
                    ...settingsUpdate
                };
                await db.insert('settings', newSettings);
                return res.json(newSettings);
            }
            
            const existingSettings = settingsArray[0];
            
            // S'assurer que la structure passwordPolicy est préservée si fournie
            if (settingsUpdate.passwordPolicy) {
                settingsUpdate.passwordPolicy = {
                    ...(existingSettings.passwordPolicy || {}),
                    ...settingsUpdate.passwordPolicy
                };
            }
            
            // Mettre à jour les paramètres
            await db.update('settings', existingSettings.id || '1', settingsUpdate);
            
            // Récupérer les paramètres mis à jour
            const updatedSettingsArray = await db.getAll('settings');
            const updatedSettings = updatedSettingsArray[0];
            
            res.json(updatedSettings);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
    
    static async createBackup(req, res) {
        try {
            // Récupérer toutes les collections principales
            const [
                admins, 
                professeurs, 
                eleves, 
                parents, 
                classes, 
                cours, 
                exercices, 
                notes, 
                messages, 
                fraisScolarite, 
                permissions, 
                soumissions, 
                adminLogs, 
                settings
            ] = await Promise.all([
                db.getAll('admins'),
                db.getAll('professeurs'),
                db.getAll('eleves'),
                db.getAll('parents'),
                db.getAll('classes'),
                db.getAll('cours'),
                db.getAll('exercices'),
                db.getAll('notes'),
                db.getAll('messages'),
                db.getAll('fraisScolarite'),
                db.getAll('permissions'),
                db.getAll('soumissions'),
                db.getAll('adminLogs'),
                db.getAll('settings')
            ]);
            
            // Constituer l'objet de sauvegarde
            const backupData = {
                admins,
                professeurs,
                eleves,
                parents,
                classes,
                cours,
                exercices,
                notes,
                messages,
                fraisScolarite,
                permissions,
                soumissions,
                adminLogs,
                settings: settings.length > 0 ? settings[0] : {}
            };
            
            // Générer le nom de fichier avec timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(__dirname, '../backups', `backup-${timestamp}.json`);
            
            // Créer le dossier backups s'il n'existe pas
            if (!fs.existsSync(path.join(__dirname, '../backups'))) {
                fs.mkdirSync(path.join(__dirname, '../backups'), { recursive: true });
            }
            
            // Écrire le fichier de sauvegarde
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            
            res.json({ 
                message: 'Sauvegarde créée avec succès', 
                path: backupPath,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erreur lors de la création de la sauvegarde:', error);
            res.status(500).json({ message: error.message });
        }
    }
    
    // Nouvelle méthode pour restaurer une sauvegarde
    static async restoreBackup(req, res) {
        try {
            const { filename } = req.params;
            
            if (!filename) {
                return res.status(400).json({ message: 'Nom de fichier de sauvegarde requis' });
            }
            
            // Vérifier que l'utilisateur est un administrateur principal
            const adminId = req.query.userId;
            const admin = await db.getById('admins', adminId);
            
            if (!admin || (!admin.isPrimary && adminId !== '1')) {
                return res.status(403).json({ 
                    message: "Seul l'administrateur principal peut restaurer une sauvegarde" 
                });
            }
            
            // Construire le chemin du fichier de sauvegarde
            const backupPath = path.join(__dirname, '../backups', filename);
            
            // Vérifier si le fichier existe
            if (!fs.existsSync(backupPath)) {
                return res.status(404).json({ message: 'Fichier de sauvegarde introuvable' });
            }
            
            // Lire et parser le fichier de sauvegarde
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            
            // Exécuter la restauration via le contrôleur de base de données
            // (Vous devez implémenter cette méthode dans dbController)
            const result = await db.restoreFromBackup(backupData);
            
            res.json({ 
                message: 'Sauvegarde restaurée avec succès',
                details: result
            });
        } catch (error) {
            console.error('Erreur lors de la restauration de la sauvegarde:', error);
            res.status(500).json({ message: error.message });
        }
    }
    
    // Nouvelle méthode pour lister les sauvegardes disponibles
    static async listBackups(req, res) {
        try {
            const backupDir = path.join(__dirname, '../backups');
            
            // Vérifier si le dossier existe
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
                return res.json({ backups: [] });
            }
            
            // Lire les fichiers du dossier
            const files = fs.readdirSync(backupDir);
            
            // Filtrer pour ne garder que les fichiers JSON et obtenir leurs statistiques
            const backups = files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: stats.size,
                        created: stats.birthtime,
                        path: filePath
                    };
                })
                .sort((a, b) => b.created - a.created); // Tri par date, plus récent d'abord
            
            res.json({ backups });
        } catch (error) {
            console.error('Erreur lors de la liste des sauvegardes:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = SettingsController;