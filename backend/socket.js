// socket.js
const db = require('./db/dbController'); // Ajoutez cette ligne

module.exports = (io) => {
  // Map to store user connections with their IDs
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Nouvelle connexion socket.io:', socket.id);

    // User authentication with socket
    socket.on('authenticate', ({ userId, userRole }) => {
      if (userId && userRole) {
        // Store user connection
        connectedUsers.set(userId, { socketId: socket.id, userRole });
        socket.userId = userId;
        socket.userRole = userRole;
        
        console.log(`Utilisateur authentifié: ${userRole} ${userId}`);
        socket.join(`${userRole}_${userId}`); // Join a room specific to this user
      }
    });

    // Event for new messages
    socket.on('sendMessage', async (messageData) => {
      try {
        // Utiliser MongoDB au lieu du fichier JSON
        const newMessage = {
          id: Date.now().toString(),
          senderId: messageData.senderId,
          senderRole: messageData.senderRole,
          receiverId: messageData.receiverId,
          receiverRole: messageData.receiverRole,
          subject: messageData.subject,
          content: messageData.content,
          date: new Date().toISOString(),
          read: false,
          attachments: []
        };
        
        // Ajouter le message à la base de données
        await db.insert('messages', newMessage);
        console.log('Message inséré dans MongoDB:', newMessage.id);

        // Si le destinataire est connecté, lui envoyer le message en temps réel
        const receiverKey = messageData.receiverId;
        const receiverConnection = connectedUsers.get(receiverKey);
        
        if (receiverConnection) {
          io.to(receiverConnection.socketId).emit('newMessage', newMessage);
        }
        
        // Également émettre vers l'expéditeur pour confirmation
        socket.emit('messageSent', newMessage);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        socket.emit('messageError', { error: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Handle read status updates
    socket.on('markAsRead', async (messageId) => {
      try {
        // Utiliser MongoDB au lieu du fichier JSON
        const message = await db.getById('messages', messageId);
        
        if (message) {
          // Mettre à jour le statut de lecture
          await db.update('messages', messageId, { 
            read: true,
            readDate: new Date().toISOString()
          });
          
          // Notifier l'expéditeur que le message a été lu
          const senderId = message.senderId;
          const senderConnection = connectedUsers.get(senderId);
          
          if (senderConnection) {
            io.to(senderConnection.socketId).emit('messageRead', messageId);
          }
          
          socket.emit('messageMarkedAsRead', messageId);
        }
      } catch (error) {
        console.error('Erreur lors du marquage du message:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`Utilisateur déconnecté: ${socket.userRole} ${socket.userId}`);
      }
    });
  });
};
