// controllers/AdminController.js
const db = require('../db/dbController');

class AdminController {
    // Méthode pour obtenir tous les administrateurs
    static async getAllAdmins(req, res) {
        try {
            const adminId = req.query.userId;
            
            // Récupérer tous les administrateurs depuis la base de données
            const admins = await db.getAll('admins');
             
            // Retourner la liste des admins
            res.json(admins);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Méthode pour créer un nouvel administrateur
    static async createAdmin(req, res) {
        try {
            const { nom, email, password, role } = req.body;
            const creatorId = req.query.userId;
            
            // Récupérer les admins pour vérifications
            const admins = await db.getAll('admins');
            
            // Vérifier si c'est l'administrateur principal
            const creator = admins.find(a => a.id === creatorId);
            if (!creator || !creator.isPrimary && creatorId !== '1') {
                return res.status(403).json({ 
                    message: "Seul l'administrateur principal peut créer d'autres administrateurs" 
                });
            }
            
            // Vérifier si l'email est déjà utilisé
            const emailExists = admins.some(admin => admin.email === email);
            if (emailExists) {
                return res.status(400).json({ message: "Cet email est déjà utilisé" });
            }
            
            // Créer un nouvel admin
            const newAdmin = {
                id: Date.now().toString(),
                nom,
                email,
                password, // Dans une vraie application, il faudrait hacher le mot de passe
                role: role || 'admin', // Par défaut 'admin'
                status: 'actif',
                isPrimary: false, // Toujours false pour les nouveaux administrateurs
                createdBy: creatorId,
                dateCreation: new Date().toISOString()
            };
            
            // Ajouter à la collection d'admins
            await db.insert('admins', newAdmin);
            
            // Omettre le mot de passe dans la réponse
            const { password: _, ...adminWithoutPassword } = newAdmin;
            
            res.status(201).json(adminWithoutPassword);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    //
    static async getPublicList(req, res) {
        try {
          const admins = await db.getAll('admins');
          
          if (!admins || admins.length === 0) {
            return res.json([]);
          }
          
          // Ne retourner que les informations essentielles
          const publicAdmins = admins.map(admin => ({
            id: admin.id, 
            nom: admin.nom,
            email: admin.email
          }));
          
          res.json(publicAdmins);
        } catch (error) {
          console.error('Erreur lors de la récupération des admins:', error);
          res.status(500).json({ message: error.message });
        }
      }
    
    // Méthode pour mettre à jour un administrateur
    static async updateAdmin(req, res) {
        try {
            const { adminId } = req.params;
            const updateData = req.body;
            const currentAdminId = req.query.userId;
            
            // Récupérer l'administrateur à mettre à jour
            const admin = await db.getById('admins', adminId);
            
            // Vérifier si l'administrateur existe
            if (!admin) {
                return res.status(404).json({ message: "Administrateur non trouvé" });
            }
            
            // Vérifier si c'est l'administrateur principal ou le créateur
            if (currentAdminId !== '1' && admin.createdBy !== currentAdminId) {
                return res.status(403).json({ 
                    message: "Vous n'avez pas l'autorisation de modifier cet administrateur" 
                });
            }
            
            // Empêcher la modification de l'admin principal par d'autres admins
            if (adminId === '1' && currentAdminId !== '1') {
                return res.status(403).json({ 
                    message: "L'administrateur principal ne peut être modifié que par lui-même" 
                });
            }
            
            // Restreindre les champs modifiables
            const allowedFields = ['nom', 'email', 'status'];
            const filteredUpdateData = {};
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    filteredUpdateData[field] = updateData[field];
                }
            });
            
            // Si le mot de passe est fourni, le mettre à jour
            if (updateData.password) {
                // Dans une vraie application, il faudrait hacher le mot de passe
                filteredUpdateData.password = updateData.password;
            }
            
            // Ajouter la date de modification
            filteredUpdateData.dateModification = new Date().toISOString();
            
            // Mettre à jour l'administrateur
            await db.update('admins', adminId, filteredUpdateData);
            
            // Récupérer l'administrateur mis à jour
            const updatedAdmin = await db.getById('admins', adminId);
            
            // Omettre le mot de passe dans la réponse
            const { password: _, ...adminWithoutPassword } = updatedAdmin;
            
            res.json(adminWithoutPassword);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
    
    // Méthode pour désactiver un administrateur
    static async deactivateAdmin(req, res) {
        try {
            const { adminId } = req.params;
            const currentAdminId = req.query.userId;
            
            // Récupérer l'administrateur
            const admin = await db.getById('admins', adminId);
            
            // Vérifier si l'administrateur existe
            if (!admin) {
                return res.status(404).json({ message: "Administrateur non trouvé" });
            }
            
            // Empêcher la désactivation de l'admin principal
            if (adminId === '1') {
                return res.status(403).json({ 
                    message: "L'administrateur principal ne peut pas être désactivé" 
                });
            }
            
            // Vérifier les autorisations
            if (currentAdminId !== '1' && admin.createdBy !== currentAdminId) {
                return res.status(403).json({ 
                    message: "Vous n'avez pas l'autorisation de désactiver cet administrateur" 
                });
            }
            
            // Désactiver l'administrateur
            await db.update('admins', adminId, {
                status: 'inactif',
                dateModification: new Date().toISOString()
            });
            
            // Récupérer l'administrateur mis à jour
            const updatedAdmin = await db.getById('admins', adminId);
            
            res.json({ 
                message: "Administrateur désactivé avec succès",
                admin: {
                    id: updatedAdmin.id,
                    nom: updatedAdmin.nom,
                    status: updatedAdmin.status
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
    
    // Méthode pour vérifier si l'utilisateur est l'administrateur principal
    static async checkIfPrimaryAdmin(req, res) {
        try {
            const adminId = req.query.userId;
            
            // Rechercher l'administrateur par ID
            const admin = await db.getById('admins', adminId);
            
            // Vérifier si c'est l'administrateur principal par l'attribut isPrimary ou par défaut par l'ID
            const isPrimaryAdmin = admin ? 
                (admin.isPrimary === true || admin.id === '1') : 
                (adminId === '1');
            
            res.json({ isPrimaryAdmin });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Méthodes existantes...
    static async assignerClasseProfesseur(req, res) {
        try {
            const { professeurId, classeId } = req.body;
            const adminId = req.query.userId; // L'ID de l'admin qui fait l'action
            
            // Vérifier si le professeur existe
            const professeur = await db.getById('professeurs', professeurId);
            if (!professeur) {
                return res.status(404).json({ message: 'Professeur non trouvé' });
            }

            // Vérifier si la classe existe
            const classe = await db.getById('classes', classeId);
            if (!classe) {
                return res.status(404).json({ message: 'Classe non trouvée' });
            }

            // Ajouter la classe aux classes du professeur
            if (!professeur.classes) {
                professeur.classes = [];
            }
            
            // Si la classe n'est pas déjà assignée
            if (!professeur.classes.includes(classeId)) {
                professeur.classes.push(classeId);
                
                // Mettre à jour le professeur
                await db.update('professeurs', professeurId, { 
                    classes: professeur.classes 
                });
                
                // Créer un log administratif
                const adminLog = {
                    id: Date.now().toString(),
                    adminId,
                    action: 'assign_class',
                    details: {
                        professeurId,
                        classeId,
                        professeurNom: professeur.nom,
                        classeNom: classe.nom
                    },
                    date: new Date().toISOString()
                };
                
                // Ajouter le log
                await db.insert('adminLogs', adminLog);
            }

            // Récupérer le professeur mis à jour
            const updatedProfesseur = await db.getById('professeurs', professeurId);
            res.json({ success: true, professeur: updatedProfesseur });

        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async retirerClasseProfesseur(req, res) {
        try {
            const { professeurId, classeId } = req.params;
            
            // Trouver le professeur
            const professeur = await db.getById('professeurs', professeurId);
            if (!professeur) {
                return res.status(404).json({ message: 'Professeur non trouvé' });
            }

            // S'assurer que classes est un tableau
            if (!professeur.classes || !Array.isArray(professeur.classes)) {
                return res.status(400).json({ message: 'Professeur n\'a pas de classes assignées' });
            }

            // Retirer la classe
            const updatedClasses = professeur.classes.filter(c => c !== classeId);
            
            // Mettre à jour le professeur
            await db.update('professeurs', professeurId, { 
                classes: updatedClasses 
            });

            // Récupérer le professeur mis à jour
            const updatedProfesseur = await db.getById('professeurs', professeurId);
            res.json({ success: true, professeur: updatedProfesseur });

        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async assignElevesToParent(req, res) {
        try {
          const { parentId } = req.params;
          const { elevesIds } = req.body;
          
          // Vérifier si l'utilisateur est admin
          const { userRole } = req.query;
          if (userRole !== 'admin') {
            return res.status(403).json({ 
              message: "Accès refusé. Privilèges administrateur requis."
            });
          }
          
          // Vérifier si le parent existe
          const parent = await db.getById('parents', parentId);
          if (!parent) {
            return res.status(404).json({ message: 'Parent non trouvé' });
          }
          
          // Vérifier que les IDs des élèves existent
          const eleves = await db.getAll('eleves');
          const elevesExist = elevesIds.every(id => 
            eleves.some(eleve => eleve.id === id)
          );
          
          if (!elevesExist) {
            return res.status(400).json({ message: 'Certains élèves n\'existent pas' });
          }
          
          // Mettre à jour les élèves associés au parent
          await db.update('parents', parentId, { elevesIds });
          
          // Récupérer le parent mis à jour
          const updatedParent = await db.getById('parents', parentId);
          
          // Retourner le parent mis à jour
          res.json({ 
            success: true, 
            parent: updatedParent
          });
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { userId, userType } = req.params;
            
            let collection;
            if (userType === 'professeur') {
                collection = 'professeurs';
            } else if (userType === 'eleve') {
                collection = 'eleves';
            } else if (userType === 'admin') {
                // Vérifier si l'admin qui fait la réinitialisation est l'admin principal
                const adminId = req.query.userId;
                if (adminId !== '1' && userId !== adminId) {
                    return res.status(403).json({ 
                        message: "Seul l'administrateur principal peut réinitialiser le mot de passe d'un autre administrateur" 
                    });
                }
                collection = 'admins';
            } else {
                return res.status(400).json({ message: 'Type d\'utilisateur non valide' });
            }
            
            // Vérifier si l'utilisateur existe
            const user = await db.getById(collection, userId);
            
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Générer un mot de passe aléatoire sécurisé
            const randomPassword = Math.random().toString(36).slice(2) + 
                                Math.random().toString(36).toUpperCase().slice(2);
            
            // Dans une vraie application, hacher le mot de passe avant de le stocker
            // Exemple avec bcrypt: const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            // Mettre à jour le mot de passe
            await db.update(collection, userId, { password: randomPassword });
            
            // Retourner le mot de passe temporaire (dans une vraie app, envoyer par email)
            res.json({ 
                message: 'Mot de passe réinitialisé avec succès',
                temporaryPassword: randomPassword 
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getSystemStats(req, res) {
        try {
            // Récupérer les données depuis MongoDB
            const [professeurs, eleves, classes, cours, exercices, notes, admins] = await Promise.all([
                db.getAll('professeurs'),
                db.getAll('eleves'),
                db.getAll('classes'),
                db.getAll('cours'),
                db.getAll('exercices'),
                db.getAll('notes'),
                db.getAll('admins')
            ]);
            
            const stats = {
                totalProfesseurs: professeurs.length,
                totalEleves: eleves.length,
                totalClasses: classes.length,
                totalCours: cours.length,
                totalExercices: exercices ? exercices.length : 0,
                totalNotes: notes.length,
                totalAdmins: admins ? admins.length : 0,
                professeursByClasse: {},
                elevesByClasse: {}
            };

            // Calculer les statistiques par classe
            classes.forEach(classe => {
                stats.professeursByClasse[classe.id] = professeurs.filter(p => 
                    p.classes && p.classes.includes(classe.id)
                ).length;
                stats.elevesByClasse[classe.id] = eleves.filter(e => 
                    e.classeId === classe.id
                ).length;
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getSettings(req, res) {
        try {
            // Récupérer les paramètres depuis la collection settings
            const settings = await db.getAll('settings');
            
            // S'il n'y a pas de paramètres, créer les valeurs par défaut
            if (!settings || settings.length === 0) {
                const defaultSettings = {
                    anneeScolaire: new Date().getFullYear().toString(),
                    systemName: 'School Manager',
                    backupEmail: '',
                    maxUploadSize: 10,
                    allowRegistration: true,
                    maintenanceMode: false,
                    notificationEmail: '',
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
                
                // Insérer les paramètres par défaut
                await db.insert('settings', defaultSettings);
                
                return res.json(defaultSettings);
            }
            
            // S'assurer que passwordPolicy existe
            let currentSettings = settings[0];
            if (!currentSettings.passwordPolicy) {
                currentSettings.passwordPolicy = {
                    minLength: 8,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    requireUppercase: true
                };
                
                // Mettre à jour les paramètres
                await db.update('settings', currentSettings.id || '1', { 
                    passwordPolicy: currentSettings.passwordPolicy 
                });
            }
            
            res.json(currentSettings);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
  
    static async updateSettings(req, res) {
        try {
            const settingsUpdate = req.body;
            
            // Récupérer les paramètres actuels
            const settings = await db.getAll('settings');
            
            if (!settings || settings.length === 0) {
                // Créer de nouveaux paramètres s'ils n'existent pas
                settingsUpdate.id = '1'; // Assigner un ID fixe pour les paramètres
                await db.insert('settings', settingsUpdate);
                return res.json(settingsUpdate);
            }
            
            // S'assurer que passwordPolicy est correctement structuré
            if (settingsUpdate.passwordPolicy) {
                settingsUpdate.passwordPolicy = {
                    ...(settings[0].passwordPolicy || {}),
                    ...settingsUpdate.passwordPolicy
                };
            }
            
            // Mettre à jour les paramètres existants
            await db.update('settings', settings[0].id || '1', settingsUpdate);
            
            // Récupérer les paramètres mis à jour
            const updatedSettings = await db.getAll('settings');
            res.json(updatedSettings[0]);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = AdminController;