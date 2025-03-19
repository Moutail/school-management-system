// socket.js
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
          // Use the message controller to save the message
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('db.json'));
          
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
          
          if (!data.messages) {
            data.messages = [];
          }
          
          data.messages.push(newMessage);
          fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  
          // If the recipient is connected, send them the message in real-time
          const receiverKey = messageData.receiverId;
          const receiverConnection = connectedUsers.get(receiverKey);
          
          if (receiverConnection) {
            io.to(receiverConnection.socketId).emit('newMessage', newMessage);
          }
          
          // Also emit to sender for confirmation
          socket.emit('messageSent', newMessage);
        } catch (error) {
          console.error('Erreur lors de l\'envoi du message:', error);
          socket.emit('messageError', { error: 'Erreur lors de l\'envoi du message' });
        }
      });
  
      // Handle read status updates
      socket.on('markAsRead', async (messageId) => {
        try {
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('db.json'));
          
          const messageIndex = data.messages.findIndex(m => m.id === messageId);
          if (messageIndex !== -1) {
            data.messages[messageIndex].read = true;
            fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
            
            // Notify sender that message was read
            const senderId = data.messages[messageIndex].senderId;
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