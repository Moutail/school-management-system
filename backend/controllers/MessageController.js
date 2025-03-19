// controllers/MessageController.js
const db = require('../db/dbController');

class MessageController {
    static async getMessages(req, res) {
        try {
          const { userId, userRole } = req.params;
          console.log("Récupération des messages pour:", userId, userRole);
          
          // Utiliser la méthode spéciale
          const messages = await db.findMessages(userId, userRole);
          console.log("Nombre de messages trouvés:", messages.length);
          
          res.json(messages);
        } catch (error) {
          console.error('Erreur:', error);
          res.status(500).json({ message: error.message });
        }
    }

    static async sendMessage(req, res) {
        try {
            const { senderId, senderRole, receiverId, receiverRole, subject, content } = req.body;
            
            console.log("Tentative d'envoi de message:", {
                senderId, senderRole, receiverId, receiverRole, subject
            });
            
            const newMessage = {
                id: Date.now().toString(),
                senderId,
                senderRole,
                receiverId,
                receiverRole,
                subject,
                content,
                date: new Date().toISOString(),
                read: false,
                attachments: []
            };
            
            console.log("Message formaté:", newMessage);
            
            // Insérer le message dans MongoDB
            const result = await db.insert('messages', newMessage);
            console.log("Résultat de l'insertion:", result);
            
            res.status(201).json(newMessage);
        } catch (error) {
            console.error('Erreur détaillée:', error);
            res.status(500).json({ message: error.message });
        }
    }

static async markAsRead(req, res) {
    try {
        const { messageId } = req.params;
        console.log("Tentative de marquer le message comme lu:", messageId);
        
        // Vérifier si le message existe
        const message = await db.getById('messages', messageId);
        if (!message) {
            console.log("Message non trouvé:", messageId);
            return res.status(404).json({ message: 'Message non trouvé' });
        }
        
        console.log("Message trouvé, application de la mise à jour");
        // Mettre à jour le message dans MongoDB
        const result = await db.update('messages', messageId, { 
            read: true,
            readDate: new Date().toISOString() 
        });
        
        console.log("Résultat de la mise à jour:", result);
        
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Message non modifié' });
        }
        
        // Récupérer le message mis à jour
        const updatedMessage = await db.getById('messages', messageId);
        res.json(updatedMessage);
    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.status(500).json({ message: error.message });
    }
}

    static async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            
            // Récupérer le message avant de le supprimer
            const message = await db.getById('messages', messageId);
            
            if (!message) {
                return res.status(404).json({ message: 'Message non trouvé' });
            }
            
            // Supprimer le message
            const result = await db.delete('messages', messageId);
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Message non trouvé' });
            }
            
            // Ajouter message à la réponse pour que le client puisse
            // utiliser ces informations pour notifier via socket s'il le souhaite
            res.json({ 
                message: 'Message supprimé avec succès',
                deletedMessage: message 
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getUnreadCount(req, res) {
        try {
            const { userId, userRole } = req.params;
            
            // Compter les messages non lus pour cet utilisateur
            const unreadMessages = await db.find('messages', {
                receiverId: userId,
                receiverRole: userRole,
                read: false
            });
            
            res.json({ count: unreadMessages.length });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async sendMessageToClass(req, res) {
        try {
            const { senderId, senderRole, classeId, subject, content } = req.body;
            
            // Trouver tous les élèves de la classe
            const elevesInClass = await db.find('eleves', { classeId });
            
            if (elevesInClass.length === 0) {
                return res.status(404).json({ message: 'Aucun élève trouvé dans cette classe' });
            }
            
            const messages = [];
            
            // Créer un message pour chaque élève de la classe
            for (const eleve of elevesInClass) {
                const newMessage = {
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
                    senderId,
                    senderRole,
                    receiverId: eleve.id,
                    receiverRole: 'eleve',
                    subject,
                    content,
                    date: new Date().toISOString(),
                    read: false,
                    attachments: []
                };
                
                messages.push(newMessage);
            }
            
            // Insérer tous les messages en même temps
            for (const message of messages) {
                await db.insert('messages', message);
            }
            
            res.status(201).json({ 
                success: true, 
                count: messages.length,
                message: `Message envoyé à ${messages.length} élèves`,
                messages // Retourner les messages pour la notification
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getMessagesWithNames(req, res) {
        try {
            const { userId, userRole } = req.params;
            
            // Récupérer les messages depuis MongoDB
            const messages = await db.find('messages', {
                $or: [
                  { receiverId: userId, receiverRole: userRole },
                  { senderId: userId, senderRole: userRole }
                ]
            });
            
            // Récupérer tous les utilisateurs (administrateurs, professeurs, élèves)
            const [admins, professeurs, eleves] = await Promise.all([
                db.getAll('admins'),
                db.getAll('professeurs'),
                db.getAll('eleves')
            ]);
            
            // Enrichir avec les noms des émetteurs/destinataires
            const enrichedMessages = messages.map(message => {
                let senderName = "Inconnu";
                let receiverName = "Inconnu";
                
                // Trouver le nom de l'émetteur
                if (message.senderRole === 'professeur') {
                    const prof = professeurs.find(p => p.id === message.senderId);
                    if (prof) senderName = prof.nom;
                } else if (message.senderRole === 'eleve') {
                    const eleve = eleves.find(e => e.id === message.senderId);
                    if (eleve) senderName = eleve.nom;
                } else if (message.senderRole === 'admin') {
                    const admin = admins.find(a => a.id === message.senderId);
                    if (admin) senderName = admin.nom;
                }
                
                // Trouver le nom du destinataire
                if (message.receiverRole === 'professeur') {
                    const prof = professeurs.find(p => p.id === message.receiverId);
                    if (prof) receiverName = prof.nom;
                } else if (message.receiverRole === 'eleve') {
                    const eleve = eleves.find(e => e.id === message.receiverId);
                    if (eleve) receiverName = eleve.nom;
                } else if (message.receiverRole === 'admin') {
                    const admin = admins.find(a => a.id === message.receiverId);
                    if (admin) receiverName = admin.nom;
                }
                
                return {
                    ...message,
                    senderName,
                    receiverName
                };
            });
            
            res.json(enrichedMessages);
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = MessageController;