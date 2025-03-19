// routes/message.routes.js
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');

// Routes spécifiques d'abord
router.get('/unread/:userId/:userRole', MessageController.getUnreadCount);
router.put('/:messageId/read', MessageController.markAsRead);
router.post('/class', MessageController.sendMessageToClass);

// Routes avec noms enrichis
router.get('/details/:userId/:userRole', MessageController.getMessagesWithNames);

// Routes génériques
router.get('/:userId/:userRole', MessageController.getMessages);
router.post('/', MessageController.sendMessage);
router.delete('/:messageId', MessageController.deleteMessage);

module.exports = router;