import { useState, useEffect, useRef } from 'react';
import { 
  Send, Inbox, Edit, Search, X, Trash2, RefreshCcw, 
  Users, Clock, ArrowLeft, Filter, Mail,
  ChevronDown, ChevronUp, UserCircle, CheckCircle,
  AlertCircle, Star, StarOff, Plus, Calendar, MessageSquare
} from 'lucide-react';
import io from 'socket.io-client';
import { API_URL } from '../config/api.config';
const Messagerie = () => {
  // États principaux
  const [messages, setMessages] = useState([]);
  const [showParents, setShowParents] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [users, setUsers] = useState({ professeurs: [], eleves: [], admins: [], parents: [] });
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('inbox');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [recipientType, setRecipientType] = useState('individual');
  const [showProfs, setShowProfs] = useState(true);
  const [showEleves, setShowEleves] = useState(true);
  const [showAdmins, setShowAdmins] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, read, unread
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [notification, setNotification] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [starredMessages, setStarredMessages] = useState([]);
  
  // Utilisateur actuel
  const currentUserId = localStorage.getItem('userId');
  const currentUserRole = localStorage.getItem('userRole');
  const currentClassId = localStorage.getItem('classeId');
  
  // État du formulaire de nouveau message
  const [newMessage, setNewMessage] = useState({
    receiverId: '',
    receiverRole: '',
    subject: '',
    content: '',
    classeId: '',
    sendToAll: false
  });

  useEffect(() => {
    // Si l'utilisateur est un parent, forcer le type de destinataire à 'individual'
    if (currentUserRole === 'parent') {
      setRecipientType('individual');
    }
  }, [currentUserRole]);
  
  // Référence pour la socket
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchMessagesWithFallback = async () => {
      try {
        // Essayer de récupérer depuis l'API
        const response = await fetch(`${API_URL}/messages/details/${currentUserId}/${currentUserRole}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        
        // Stocker dans localStorage pour la persistance locale
        localStorage.setItem('cachedMessages', JSON.stringify(data));
        
        // Mettre à jour l'état
        setMessages(data.map(message => ({
          ...message,
          dateObj: new Date(message.date)
        })));
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        
        // Fallback: utiliser les messages en cache
        const cachedMessages = JSON.parse(localStorage.getItem('cachedMessages') || '[]');
        setMessages(cachedMessages.map(message => ({
          ...message,
          dateObj: new Date(message.date)
        })));
      }
    };
    
    fetchMessagesWithFallback();
  }, [currentUserId, currentUserRole]);

  // Initialisation de la socket
  useEffect(() => {
    // Créer la connexion socket
    socketRef.current = io('https://school-system-backend-ua7r.onrender.com');
    
    // Écouter les événements
    socketRef.current.on('connect', () => {
      console.log('Socket.IO connecté');
      
      // Authentifier l'utilisateur avec la socket
      socketRef.current.emit('authenticate', {
        userId: currentUserId,
        userRole: currentUserRole
      });
    });
    
    // Écouter les nouveaux messages
    socketRef.current.on('newMessage', (message) => {
      console.log('Nouveau message reçu:', message);
      
      // Mettre à jour l'état des messages
      setMessages(prevMessages => {
        // Vérifier si le message existe déjà
        const messageExists = prevMessages.some(m => m.id === message.id);
        if (messageExists) return prevMessages;
        
        // Ajouter le nouveau message et convertir la date en objet
        return [{
          ...message,
          dateObj: new Date(message.date)
        }, ...prevMessages];
      });
      
      // Afficher une notification
      showNotification(`Nouveau message: ${message.subject}`, "info");
    });
    
    // Écouter les confirmations d'envoi
    socketRef.current.on('messageSent', (message) => {
      console.log('Message envoyé confirmé:', message);
      // Mettre à jour les messages si nécessaire
    });
    
    // Écouter les erreurs
    socketRef.current.on('messageError', (error) => {
      console.error('Erreur de messagerie:', error);
      showNotification("Erreur lors de l'envoi du message", "error");
    });
    
    // Écouter les mises à jour de statut de lecture
    socketRef.current.on('messageRead', (messageId) => {
      setMessages(prevMessages => 
        prevMessages.map(m => 
          m.id === messageId ? {...m, read: true} : m
        )
      );
    });
    
    return () => {
      // Nettoyer la connexion à la déconnexion
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId, currentUserRole]);

  // Vérification des données chargées pour déboguer
  useEffect(() => {
    console.log("État actuel des utilisateurs:", {
      professeurs: users.professeurs.length,
      eleves: users.eleves.length,
      admins: users.admins.length
    });
    
    if (users.professeurs.length === 0) {
      console.warn("Aucun professeur chargé!");
    }
    
    if (users.eleves.length === 0) {
      console.warn("Aucun élève chargé!");
    }
  }, [users]);

  useEffect(() => {
    // Si l'utilisateur est un professeur, présélectionner sa classe actuelle
    if (currentUserRole === 'professeur' && currentClassId) {
      setSelectedClassId(currentClassId);
    }
  }, [currentUserRole, currentClassId]);

  // Chargement initial des données
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMessages(),
          fetchUsers(),
          fetchClasses()
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement initial des données:", error);
        showNotification("Erreur lors du chargement des données", "error");
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Effet pour marquer un message comme lu
  useEffect(() => {
    if (selectedMessage && !selectedMessage.read) {
      markAsRead(selectedMessage.id);
    }
  }, [selectedMessage]);

  // Fonctions de récupération des données
  const fetchMessages = async () => {
    try {
      // Utiliser la route qui enrichit les messages avec les noms des utilisateurs
      const response = await fetch(`${API_URL}/messages/details/${currentUserId}/${currentUserRole}`);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      
      // Ajouter une propriété temporelle pour faciliter le filtrage par date
      const messagesWithDate = data.map(message => ({
        ...message,
        dateObj: new Date(message.date)
      }));
      
      setMessages(messagesWithDate);
      return messagesWithDate;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      showNotification("Impossible de récupérer les messages", "error");
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      console.log("Début du chargement des utilisateurs");
      
      // Au lieu de Promise.all, faisons les requêtes une par une pour mieux identifier les problèmes
      try {
        console.log("Chargement des professeurs...");
        const professeursRes = await fetch(`${API_URL}/professeurs`);
        console.log("Réponse professeurs:", professeursRes.status);
        
        if (!professeursRes.ok) {
          throw new Error(`Erreur lors du chargement des professeurs: ${professeursRes.status} ${professeursRes.statusText}`);
        }

        console.log("Chargement des parents...");
        const parentsRes = await fetch(`${API_URL}/parents`);
        console.log("Réponse parents:", parentsRes.status);
        
        if (parentsRes.ok) {
          // Utiliser d'abord .text() pour vérifier le contenu
          const parentsText = await parentsRes.text();
          console.log("Réponse parents brute:", parentsText);
          
          let parents = [];
          try {
            // Puis parser en JSON si c'est valide
            parents = JSON.parse(parentsText);
          } catch (jsonError) {
            console.error("Erreur parsing JSON parents:", jsonError);
          }
          
          console.log("Parents chargés:", parents);
          setUsers(prev => ({ ...prev, parents: Array.isArray(parents) ? parents : [] }));
        } else {
          console.warn("Pas de données de parents disponibles:", parentsRes.status);
          setUsers(prev => ({ ...prev, parents: [] }));
        }
              
        const professeurs = await professeursRes.json();
        console.log("Professeurs chargés:", professeurs);
        
        // Mise à jour partielle pour permettre un affichage progressif
        setUsers(prev => ({ ...prev, professeurs: Array.isArray(professeurs) ? professeurs : [] }));
      } catch (error) {
        console.error("Échec du chargement des professeurs:", error);
        setUsers(prev => ({ ...prev, professeurs: [] }));
      }
      
      try {
        console.log("Chargement des élèves...");
        const elevesRes = await fetch(`${API_URL}/eleves`);
        console.log("Réponse élèves (status):", elevesRes.status);
        
        if (!elevesRes.ok) {
          throw new Error(`Erreur lors du chargement des élèves: ${elevesRes.status}`);
        }
        
        // Log du contenu brut pour vérification
        const textResponse = await elevesRes.text();
        
        // Essayer de parser le JSON
        let eleves = [];
        try {
          eleves = JSON.parse(textResponse);
        } catch (jsonError) {
          console.error("Erreur lors du parsing JSON des élèves:", jsonError);
          showNotification("Erreur de format dans les données élèves", "error");
        }
        
        console.log("Élèves chargés (après parsing):", eleves);
        
        if (!Array.isArray(eleves)) {
          console.warn("La réponse élèves n'est pas un tableau:", eleves);
          eleves = [];
        }
        
        // Mise à jour partielle
        setUsers(prev => ({ ...prev, eleves }));
      } catch (error) {
        console.error("Échec du chargement des élèves:", error);
        setUsers(prev => ({ ...prev, eleves: [] }));
      }

      try {
        console.log("Chargement des admins...");
        
        // Essayez d'abord de charger depuis l'API
        const adminsRes = await fetch(`${API_URL}/api/admins/list`);
        console.log("Réponse admins:", adminsRes.status);
        
        if (adminsRes.ok) {
          const admins = await adminsRes.json();
          console.log("Admins chargés:", admins);
          setUsers(prev => ({ ...prev, admins: Array.isArray(admins) ? admins : [] }));
        } else {
          console.warn("Pas de données d'admin disponibles:", adminsRes.status);
          
          // Utiliser des données codées en dur comme solution de secours
          const hardcodedAdmins = [
            {
              id: "1",
              nom: "Admin Principal",
              email: "admin@example.com"
            },
            {
              id: "2",
              nom: "Admin Secondaire",
              email: "admin2@example.com"
            },
            {
              id: "1742012051848",
              nom: "benjamin",
              email: "benjamin@gmail.com"
            }
          ];
          
          setUsers(prev => ({ ...prev, admins: hardcodedAdmins }));
          console.log("Utilisation de données admin codées en dur");
        }
      } catch (error) {
        console.error("Échec du chargement des admins:", error);
        setUsers(prev => ({ ...prev, admins: [] }));
      }
      
    } catch (error) {
      console.error('Erreur générale lors du chargement des utilisateurs:', error);
      setUsers({ professeurs: [], eleves: [], admins: [] });
      showNotification("Erreur lors du chargement des utilisateurs", "error");
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${API_URL}/classes`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
      setClasses([]);
      showNotification("Erreur lors du chargement des classes", "error");
    }
  };

  // Fonctions de manipulation des messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    try {
      if (recipientType === 'individual') {
        // Vérifier si socketRef.current est disponible
        if (socketRef.current && socketRef.current.connected) {
          // Utilisez Socket.IO pour envoyer le message
          socketRef.current.emit('sendMessage', {
            ...newMessage,
            senderId: currentUserId,
            senderRole: currentUserRole
          });
        } else {
          // Fallback à l'API REST si socket n'est pas disponible
          await sendMessage({
            ...newMessage,
            senderId: currentUserId,
            senderRole: currentUserRole
          });
          
          // Rafraîchir les messages
          await fetchMessages();
        }
        
        // Fermeture modale et réinitialisation
        setShowNewMessage(false);
        resetNewMessageForm();
        showNotification("Message en cours d'envoi...");
      } 
      else if (recipientType === 'class') {
        // Référence correcte à elevesInClass
        const elevesInClass = users.eleves.filter(eleve => eleve.classeId === selectedClassId);
        
        // Afficher un avertissement si aucun élève
        if (elevesInClass.length === 0) {
          showNotification("Attention: cette classe ne contient aucun élève", "info");
        }
        
        // Pour les messages de classe, utilisez toujours l'API REST
        const response = await fetch(`${API_URL}/api/messages/class`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUserId,
            senderRole: currentUserRole,
            classeId: selectedClassId,
            subject: newMessage.subject,
            content: newMessage.content
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
         // Après un envoi réussi, mettre à jour le cache local
          const newMessage = {
            id: Date.now().toString(),
            senderId: currentUserId,
            senderRole: currentUserRole,
            receiverId: newMessage.receiverId,
            receiverRole: newMessage.receiverRole,
            subject: newMessage.subject,
            content: newMessage.content,
            date: new Date().toISOString(),
            read: false
          };
          
          // Ajouter au cache local
          const cachedMessages = JSON.parse(localStorage.getItem('cachedMessages') || '[]');
          cachedMessages.push(newMessage);
          localStorage.setItem('cachedMessages', JSON.stringify(cachedMessages));
        // Fermeture modale et réinitialisation
        setShowNewMessage(false);
        resetNewMessageForm();
        showNotification(`Message envoyé à ${result.count} élèves`);
        
        // Rafraîchir les messages
        await fetchMessages();
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      showNotification("Erreur lors de l'envoi du message", "error");
    }
  };

  const sendMessage = async (messageData) => {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
    
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  };

  const markAsRead = async (messageId) => {
    try {
        console.log("Marquer comme lu:", messageId);
        
        // Mettre à jour l'état local immédiatement pour une meilleure UX
        setMessages(messages.map(m => 
            m.id === messageId ? {...m, read: true} : m
        ));
        
        // Informer le serveur via socket.io
        if (socketRef.current) {
            console.log("Envoi via socket.io");
            socketRef.current.emit('markAsRead', messageId);
        }
        
        // Également utiliser l'API REST pour s'assurer que le changement est persistant
        console.log("Envoi de requête à:", ``${API_URL}/messages/${messageId}/read`);
        const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
            method: 'PUT'
        });
        
        if (!response.ok) {
            console.error("Échec de la requête:", await response.text());
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Réponse du serveur:", data);
    } catch (error) {
        console.error('Erreur détaillée lors du marquage du message:', error);
        // Ne pas afficher de notification pour ne pas perturber l'utilisateur,
        // puisque l'UI est déjà mise à jour
    }
};

  const handleDeleteMessage = async (messageId, e) => {
    if (e) e.stopPropagation();
    
    if (window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      try {
        const response = await fetch(`${API_URL}/messages/${messageId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        setMessages(messages.filter(m => m.id !== messageId));
        showNotification("Message supprimé");
        
        // Si le message supprimé est sélectionné, désélectionner
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(null);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification("Erreur lors de la suppression du message", "error");
      }
    }
  };

  // Fonctions utilitaires
  const resetNewMessageForm = () => {
    setNewMessage({
      receiverId: '',
      receiverRole: '',
      subject: '',
      content: '',
      classeId: '',
      sendToAll: false
    });
    setSelectedClassId('');
    setRecipientType('individual');
    setSearchTerm('');
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchMessages();
    setLoading(false);
  };

  const getSenderOrReceiverName = (message) => {
    const isInbox = message.receiverId === currentUserId;
    const targetId = isInbox ? message.senderId : message.receiverId;
    const targetRole = isInbox ? message.senderRole : message.receiverRole;
    
    // Si le message a déjà les noms enrichis, les utiliser
    if (isInbox && message.senderName) {
      return { name: message.senderName, details: "", isInbox };
    } else if (!isInbox && message.receiverName) {
      return { name: message.receiverName, details: "", isInbox };
    }
    
    // Sinon, chercher le nom comme avant
    let targetName = "Utilisateur inconnu";
    let targetDetails = "";
    
    if (targetRole === 'professeur') {
      const prof = users.professeurs.find(p => p.id === targetId);
      if (prof) {
        targetName = prof.nom;
        targetDetails = prof.matieres ? prof.matieres.join(', ') : '';
      }
    } else if (targetRole === 'eleve') {
      const eleve = users.eleves.find(e => e.id === targetId);
      if (eleve) {
        targetName = eleve.nom;
        const classeNom = classes.find(c => c.id === eleve.classeId)?.nom;
        targetDetails = classeNom || '';
      }
    } else if (targetRole === 'admin') {
      const admin = users.admins.find(a => a.id === targetId);
      if (admin) {
        targetName = admin.nom;
        targetDetails = "Administration";
      }
    } else if (targetRole === 'parent') {
      const parent = users.parents.find(p => p.id === targetId);
      if (parent) {
        targetName = parent.nom;
        targetDetails = "Parent";
      }
    }
    
    return { name: targetName, details: targetDetails, isInbox };
  };

  const toggleStarMessage = (messageId) => {
    if (starredMessages.includes(messageId)) {
      setStarredMessages(starredMessages.filter(id => id !== messageId));
    } else {
      setStarredMessages([...starredMessages, messageId]);
    }
  };

  const showNotification = (message, type = "success") => {
    // Créer une notification visuelle dans l'interface
    setNotification({ message, type });
    
    // Effacer automatiquement après 5 secondes
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Filtres pour les messages
  const getFilteredMessages = () => {
    // Obtenir la vue correcte
    let viewMessages = messages.filter(m => {
      if (view === 'inbox') 
        return m.receiverId === currentUserId;
      else if (view === 'sent')
        return m.senderId === currentUserId;
      else if (view === 'starred')
        return starredMessages.includes(m.id);
      return false;
    });
    
    // Appliquer les filtres
    return viewMessages
      // Filtrer par terme de recherche
      .filter(m =>
        m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
      // Filtrer par statut de lecture
      .filter(m => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'read') return m.read;
        if (statusFilter === 'unread') return !m.read;
        return true;
      })
      // Filtrer par date
      .filter(m => {
        if (dateFilter === 'all') return true;
        
        const now = new Date();
        const messageDate = new Date(m.date);
        
        if (dateFilter === 'today') {
          return messageDate.toDateString() === now.toDateString();
        }
        
        if (dateFilter === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return messageDate >= oneWeekAgo;
        }
        
        if (dateFilter === 'month') {
          const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return messageDate >= oneMonthAgo;
        }
        
        return true;
      })
      // Trier par date décroissante
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // Rendu conditionnel pour le chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-700">Chargement de vos messages...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant que nous récupérons vos données</p>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Composant de notification - redesigné */}
      {notification && (
        <div className={`fixed top-4 right-4 ${
          notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
          notification.type === 'info' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
          'bg-gradient-to-r from-green-500 to-green-600'
        } text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 max-w-xs animate-fadeIn transform transition-transform duration-300`}>
          {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'info' && <Mail className="w-5 h-5" />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}
      
      {/* Bouton d'affichage de la sidebar sur mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 z-10">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg"
        >
          <Mail className="w-6 h-6" />
        </button>
      </div>
    
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Messagerie</h1>
            <p className="text-gray-500">Communiquez avec vos contacts</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNewMessage(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-md transition-all"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau message</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar pour desktop et mobile (avec classe conditionnelle pour mobile) */}
          <div className={`lg:w-64 space-y-3 mb-4 lg:mb-0 ${
            isMobileSidebarOpen 
              ? 'fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:static lg:bg-transparent' 
              : 'hidden lg:block'
          }`}>
            <div className={`bg-white rounded-2xl shadow-md overflow-hidden h-auto transition-all duration-300 ${
              isMobileSidebarOpen ? 'w-3/4 ml-auto h-full' : ''
            }`}>
              {/* En-tête mobile uniquement */}
              {isMobileSidebarOpen && (
                <div className="border-b p-4 flex justify-between items-center lg:hidden">
                  <h2 className="font-bold text-gray-800">Menu de navigation</h2>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {/* Icône d'application - uniquement sur desktop */}
              <div className="hidden lg:flex items-center gap-3 p-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Messagerie</h2>
                  <p className="text-xs text-gray-500">École Nuage</p>
                </div>
              </div>
              
              {/* Menu principal */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setView('inbox');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    view === 'inbox' 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    view === 'inbox' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Inbox className={`w-5 h-5 ${view === 'inbox' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Boîte de réception</span>
                    <p className="text-xs text-gray-500">Messages reçus</p>
                  </div>
                  {messages.filter(m => 
                    m.receiverId === currentUserId && !m.read
                  ).length > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full">
                      {messages.filter(m => 
                        m.receiverId === currentUserId && !m.read
                      ).length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setView('sent');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    view === 'sent' 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    view === 'sent' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Send className={`w-5 h-5 ${view === 'sent' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Messages envoyés</span>
                    <p className="text-xs text-gray-500">Historique d&apos;envoi</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setView('starred');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    view === 'starred' 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    view === 'starred' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Star className={`w-5 h-5 ${view === 'starred' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Messages favoris</span>
                    <p className="text-xs text-gray-500">Vos messages importants</p>
                  </div>
                  {starredMessages.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full">
                      {starredMessages.length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Bouton Nouveau message - visible uniquement sur mobile */}
              <div className="p-4 border-t border-gray-100 lg:hidden">
                <button
                  onClick={() => {
                    setShowNewMessage(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nouveau message</span>
                </button>
              </div>
            </div>
            
            {/* Filtres */}
            <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
              <h3 className="font-medium text-gray-800 flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filtres</span>
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Statut de lecture
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                >
                  <option value="all">Tous les messages</option>
                  <option value="read">Messages lus</option>
                  <option value="unread">Messages non lus</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Période
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">Aujourd&apos;hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois-ci</option>
                </select>
              </div>
              
              {/* Statistiques */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Statistiques</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total reçus:</span>
                    <span className="font-medium">
                      {messages.filter(m => m.receiverId === currentUserId).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Non lus:</span>
                    <span className="font-medium text-blue-600">
                      {messages.filter(m => m.receiverId === currentUserId && !m.read).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total envoyés:</span>
                    <span className="font-medium">
                      {messages.filter(m => m.senderId === currentUserId).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone principale de contenu */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Barre de recherche */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
              </div>

              {/* Liste des messages */}
              <div className="divide-y max-h-[calc(100vh-280px)] overflow-y-auto">
                {getFilteredMessages().map(message => {
                  const { name, details, isInbox } = getSenderOrReceiverName(message);
                  const isStarred = starredMessages.includes(message.id);
                  
                  return (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 cursor-pointer transition-colors ${
                        !message.read && isInbox ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {!message.read && isInbox && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                          <h3 className={`font-medium text-base ${!message.read && isInbox ? 'text-blue-800' : 'text-gray-800'}`}>
                            {message.subject}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarMessage(message.id);
                            }}
                            className={`p-1.5 rounded-full ${isStarred ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'}`}
                          >
                            {isStarred ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => handleDeleteMessage(message.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {name ? name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {isInbox ? `De: ${name}` : `À: ${name}`}
                            </p>
                            {details && (
                              <p className="text-xs text-gray-500">
                                {details}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(message.date)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-2">
                        {message.content}
                      </p>
                    </div>
                  );
                })}
                
                {getFilteredMessages().length === 0 && (
                  <div className="p-8 text-center">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">Aucun message</h3>
                    <p className="text-gray-500">
                      {view === 'inbox' ? 'Votre boîte de réception est vide' : 
                       view === 'sent' ? 'Vous n\'avez envoyé aucun message' :
                       'Aucun message favori'}
                      {searchTerm && " correspondant à votre recherche"}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-3 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Effacer la recherche
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="bg-white rounded-2xl shadow-md p-4 mt-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  {getFilteredMessages().length} message{getFilteredMessages().length > 1 ? 's' : ''}
                  {view === 'inbox' ? ' reçu' : view === 'sent' ? ' envoyé' : ' favori'}
                  {getFilteredMessages().length > 1 ? 's' : ''}
                </span>
                {view === 'inbox' && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {messages.filter(m => m.receiverId === currentUserId && !m.read).length} 
                    {messages.filter(m => m.receiverId === currentUserId && !m.read).length > 1 ? 'messages non lus' : 'message non lu'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nouveau message */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Nouveau message</h2>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  resetNewMessageForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-5 space-y-5">
              {/* Type de destinataire */}
              {currentUserRole !== 'eleve' && currentUserRole !== 'parent' && (
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    Type de destinataire
                  </p>
                  <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-xl">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        value="individual"
                        checked={recipientType === 'individual'}
                        onChange={() => setRecipientType('individual')}
                        className="mr-2 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-blue-600" />
                        Destinataire unique
                      </span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        value="class"
                        checked={recipientType === 'class'}
                        onChange={() => setRecipientType('class')}
                        className="mr-2 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        Classe entière
                      </span>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Sélection du destinataire */}
              {recipientType === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataire
                  </label>
                  
                  {/* Champ de recherche */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un destinataire..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    />
                  </div>
                  
                  {/* Liste des destinataires avec sections collapsables */}
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {/* Section Professeurs */}
                    <div>
                      <div 
                        className="bg-gray-100 px-4 py-2.5 font-medium cursor-pointer flex justify-between items-center"
                        onClick={() => setShowProfs(!showProfs)}
                      >
                        <span className="flex items-center gap-1.5">
                          <UserCircle className="w-4 h-4 text-blue-600" />
                          Professeurs
                        </span>
                        <button className="text-gray-500 focus:outline-none p-1 hover:bg-gray-200 rounded-full">
                          {showProfs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {showProfs && (
                        <div className="py-1">
                          {users.professeurs
                            .filter(prof => prof.nom.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(prof => (
                              <div 
                                key={prof.id}
                                onClick={() => {
                                  setNewMessage({
                                    ...newMessage,
                                    receiverId: prof.id,
                                    receiverRole: 'professeur'
                                  });
                                }}
                                className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center ${
                                  newMessage.receiverId === prof.id && newMessage.receiverRole === 'professeur' 
                                    ? 'bg-blue-100' 
                                    : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  checked={newMessage.receiverId === prof.id && newMessage.receiverRole === 'professeur'}
                                  onChange={() => {}}
                                  className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {prof.nom ? prof.nom.charAt(0).toUpperCase() : 'P'}
                                  </div>
                                  <div>
                                    <span className="font-medium">{prof.nom}</span>
                                    {prof.matieres && (
                                      <p className="text-xs text-gray-500">
                                        {prof.matieres.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          
                          {users.professeurs.filter(prof => prof.nom.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                            <div className="px-4 py-2.5 text-gray-500 italic text-sm">
                              Aucun professeur trouvé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Section Élèves */}
                    {currentUserRole !== 'parent' && (
                      <div>
                        <div 
                          className="bg-gray-100 px-4 py-2.5 font-medium cursor-pointer flex justify-between items-center"
                          onClick={() => setShowEleves(!showEleves)}
                        >
                          <span className="flex items-center gap-1.5">
                            <UserCircle className="w-4 h-4 text-green-600" />
                            Élèves
                          </span>
                          <button className="text-gray-500 focus:outline-none p-1 hover:bg-gray-200 rounded-full">
                            {showEleves ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                                        
                        {showEleves && (
                          <div className="py-1">
                            {users.eleves
                              .filter(eleve => {
                                // Ne pas afficher l'utilisateur actuel dans la liste
                                if (eleve.id === currentUserId) return false;

                                // Pour les professeurs, filtrer par classe si classeId est défini
                                if (currentUserRole === 'professeur' && currentClassId) {
                                  return eleve.classeId === currentClassId;
                                }
                                
                                // Pour les autres utilisateurs ou professeurs sans classe assignée, 
                                // afficher tous les élèves
                                return true;
                              })
                              .filter(eleve => eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(eleve => (
                                <div 
                                  key={eleve.id}
                                  onClick={() => {
                                    setNewMessage({
                                      ...newMessage,
                                      receiverId: eleve.id,
                                      receiverRole: 'eleve'
                                    });
                                  }}
                                  className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center ${
                                    newMessage.receiverId === eleve.id && newMessage.receiverRole === 'eleve' 
                                      ? 'bg-blue-100' 
                                      : ''
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    checked={newMessage.receiverId === eleve.id && newMessage.receiverRole === 'eleve'}
                                    onChange={() => {}}
                                    className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                      {eleve.nom ? eleve.nom.charAt(0).toUpperCase() : 'E'}
                                    </div>
                                    <div>
                                      <span className="font-medium">{eleve.nom}</span>
                                      {classes.find(c => c.id === eleve.classeId)?.nom && (
                                        <p className="text-xs text-gray-500">
                                          {classes.find(c => c.id === eleve.classeId)?.nom}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            
                            {users.eleves
                              .filter(eleve => eleve.id !== currentUserId)
                              .filter(eleve => {
                                // Même logique de filtrage que ci-dessus
                                if (currentUserRole === 'professeur' && currentClassId) {
                                  return eleve.classeId === currentClassId;
                                }
                                return true;
                              })
                              .filter(eleve => eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()))
                              .length === 0 && (
                                <div className="px-4 py-2.5 text-gray-500 italic text-sm">
                                  Aucun élève trouvé
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Section Parents */}
                    {(currentUserRole === 'admin' || currentUserRole === 'professeur' || currentUserRole === 'parent') && (
                      <div>
                        <div 
                          className="bg-gray-100 px-4 py-2.5 font-medium cursor-pointer flex justify-between items-center"
                          onClick={() => setShowParents(!showParents)}
                        >
                          <span className="flex items-center gap-1.5">
                            <UserCircle className="w-4 h-4 text-purple-600" />
                            Parents
                          </span>
                          <button className="text-gray-500 focus:outline-none p-1 hover:bg-gray-200 rounded-full">
                            {showParents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                                            
                        {showParents && (
                          <div className="py-1">
                            {users.parents
                              .filter(parent => parent.nom.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(parent => (
                                <div 
                                  key={parent.id}
                                  onClick={() => {
                                    setNewMessage({
                                      ...newMessage,
                                      receiverId: parent.id,
                                      receiverRole: 'parent'
                                    });
                                  }}
                                  className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center ${
                                    newMessage.receiverId === parent.id && newMessage.receiverRole === 'parent' 
                                      ? 'bg-blue-100' 
                                      : ''
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    checked={newMessage.receiverId === parent.id && newMessage.receiverRole === 'parent'}
                                    onChange={() => {}}
                                    className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                      {parent.nom ? parent.nom.charAt(0).toUpperCase() : 'P'}
                                    </div>
                                    <div>
                                      <span className="font-medium">{parent.nom}</span>
                                      {parent.elevesIds && parent.elevesIds.length > 0 && (
                                        <p className="text-xs text-gray-500">
                                          {parent.elevesIds.length} enfant(s)
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            
                            {users.parents.filter(parent => parent.nom.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                              <div className="px-4 py-2.5 text-gray-500 italic text-sm">
                                Aucun parent trouvé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Section Administration */}
                    {users.admins && users.admins.length > 0 && (
                      <div>
                        <div 
                          className="bg-gray-100 px-4 py-2.5 font-medium cursor-pointer flex justify-between items-center"
                          onClick={() => setShowAdmins(!showAdmins)}
                        >
                          <span className="flex items-center gap-1.5">
                            <UserCircle className="w-4 h-4 text-red-600" />
                            Administration
                          </span>
                          <button className="text-gray-500 focus:outline-none p-1 hover:bg-gray-200 rounded-full">
                            {showAdmins ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        {showAdmins && (
                          <div className="py-1">
                            {users.admins
                              .filter(admin => admin.nom.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(admin => (
                                <div 
                                key={admin.id}
                                onClick={() => {
                                  setNewMessage({
                                    ...newMessage,
                                    receiverId: admin.id,
                                    receiverRole: 'admin'
                                  });
                                }}
                                className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center ${
                                  newMessage.receiverId === admin.id && newMessage.receiverRole === 'admin' 
                                    ? 'bg-blue-100' 
                                    : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  checked={newMessage.receiverId === admin.id && newMessage.receiverRole === 'admin'}
                                  onChange={() => {}}
                                  className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {admin.nom ? admin.nom.charAt(0).toUpperCase() : 'A'}
                                  </div>
                                  <span className="font-medium">{admin.nom}</span>
                                </div>
                              </div>
                            ))}
                            
                          {users.admins.filter(admin => admin.nom.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                            <div className="px-4 py-2.5 text-gray-500 italic text-sm">
                              Aucun administrateur trouvé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Affichage du destinataire sélectionné */}
                {newMessage.receiverId && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        newMessage.receiverRole === 'professeur' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        newMessage.receiverRole === 'eleve' ? 'bg-gradient-to-br from-green-500 to-teal-600' :
                        newMessage.receiverRole === 'parent' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                        'bg-gradient-to-br from-red-500 to-rose-600'
                      }`}>
                        {newMessage.receiverRole === 'professeur' 
                          ? users.professeurs.find(p => p.id === newMessage.receiverId)?.nom.charAt(0).toUpperCase() 
                          : newMessage.receiverRole === 'eleve'
                            ? users.eleves.find(e => e.id === newMessage.receiverId)?.nom.charAt(0).toUpperCase()
                            : newMessage.receiverRole === 'parent'
                              ? users.parents.find(p => p.id === newMessage.receiverId)?.nom.charAt(0).toUpperCase()
                              : users.admins?.find(a => a.id === newMessage.receiverId)?.nom.charAt(0).toUpperCase() || "?"
                        }
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">
                          {newMessage.receiverRole === 'professeur' 
                            ? users.professeurs.find(p => p.id === newMessage.receiverId)?.nom 
                            : newMessage.receiverRole === 'eleve'
                              ? users.eleves.find(e => e.id === newMessage.receiverId)?.nom
                              : newMessage.receiverRole === 'parent'
                                ? users.parents.find(p => p.id === newMessage.receiverId)?.nom
                                : users.admins?.find(a => a.id === newMessage.receiverId)?.nom || "Inconnu"
                          }
                        </p>
                        <p className="text-xs text-blue-600">
                          {newMessage.receiverRole === 'professeur' ? 'Professeur' : 
                           newMessage.receiverRole === 'eleve' ? 'Élève' : 
                           newMessage.receiverRole === 'parent' ? 'Parent' : 'Administration'}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setNewMessage({ ...newMessage, receiverId: '', receiverRole: '' })}
                      className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Sélection de classe */}
            {recipientType === 'class' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe destinataire
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="block w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  required={recipientType === 'class'}
                >
                  <option value="">-- Sélectionner une classe --</option>
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom}
                    </option>
                  ))}
                </select>
                
                {selectedClassId && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 text-green-800">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium">
                          {classes.find(c => c.id === selectedClassId)?.nom}
                        </span>
                        <p className="text-sm text-green-600 mt-1">
                          {users.eleves.filter(e => e.classeId === selectedClassId).length} élèves recevront ce message
                        </p>
                      </div>
                    </div>
                    {users.eleves.filter(e => e.classeId === selectedClassId).length === 0 && (
                      <p className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Attention: Cette classe ne contient aucun élève.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Sujet du message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet
              </label>
              <input
                type="text"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                className="block w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                required
                placeholder="Sujet du message"
              />
            </div>
            
            {/* Contenu du message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                rows={6}
                className="block w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                required
                placeholder="Écrivez votre message ici..."
              />
            </div>
            
            {/* Boutons de soumission */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowNewMessage(false);
                  resetNewMessageForm();
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                disabled={(recipientType === 'individual' && !newMessage.receiverId) || 
                        (recipientType === 'class' && !selectedClassId) ||
                        !newMessage.subject ||
                        !newMessage.content}
              >
                <Send className="w-4 h-4" />
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Modal détail message */}
    {selectedMessage && (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-5 border-b">
            <button
              onClick={() => setSelectedMessage(null)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Retour</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStarMessage(selectedMessage.id);
                }}
                className={`p-2 rounded-lg ${
                  starredMessages.includes(selectedMessage.id) 
                    ? 'text-amber-500 hover:bg-amber-50' 
                    : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
                }`}
                title={starredMessages.includes(selectedMessage.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                {starredMessages.includes(selectedMessage.id) 
                  ? <Star className="w-5 h-5" /> 
                  : <StarOff className="w-5 h-5" />
                }
              </button>
              <button
                onClick={(e) => {
                  handleDeleteMessage(selectedMessage.id, e);
                  setSelectedMessage(null);
                }}
                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedMessage.subject}</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      selectedMessage.senderRole === 'professeur' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                      selectedMessage.senderRole === 'eleve' ? 'bg-gradient-to-br from-green-500 to-teal-600' :
                      selectedMessage.senderRole === 'parent' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                      'bg-gradient-to-br from-red-500 to-rose-600'
                    }`}>
                      {getSenderOrReceiverName({
                        ...selectedMessage,
                        receiverId: 'temp'
                      }).name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        De: {getSenderOrReceiverName({
                          ...selectedMessage,
                          receiverId: 'temp'
                        }).name}
                      </p>
                      <p className="text-sm text-gray-600">
                        À: {getSenderOrReceiverName({
                          ...selectedMessage,
                          senderId: 'temp'
                        }).name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 flex items-center justify-end gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(selectedMessage.date)}
                    </p>
                    {selectedMessage.read ? (
                      <p className="text-xs text-green-600 flex items-center justify-end gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Lu le {formatDate(selectedMessage.readDate || selectedMessage.date)}
                      </p>
                    ) : (
                      <p className="text-xs text-blue-600 flex items-center justify-end gap-1 mt-1">
                        <MessageSquare className="w-3 h-3" />
                        Non lu
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="prose max-w-none py-4 text-gray-800">
                {selectedMessage.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-3">{line}</p>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    // Préremplir un formulaire de réponse
                    const { name } = getSenderOrReceiverName(selectedMessage);
                    setNewMessage({
                      receiverId: selectedMessage.senderId,
                      receiverRole: selectedMessage.senderRole,
                      subject: `Re: ${selectedMessage.subject}`,
                      content: `\n\n------ Message original de ${name} ------\n${selectedMessage.content}`
                    });
                    setSelectedMessage(null);
                    setShowNewMessage(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Répondre
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Messagerie;
