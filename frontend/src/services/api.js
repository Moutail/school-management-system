// src/services/api.js
import { API_URL } from '../config/api.config';


//service eleve 
export const fetchEleves = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(
      `http://localhost:5000/api/eleves?userId=${userId}&userRole=${userRole}`
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Données élèves récupérées:', data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des élèves:', error);
    throw error;
  }
};
//Recuperer utilisateurs
export const getUsers = async () => {
  try {
    const [professeursRes, elevesRes] = await Promise.all([
      fetch(`${API_URL}/professeurs`),
      fetch(`${API_URL}/eleves`)
    ]);
    
    const [professeurs, eleves] = await Promise.all([
      professeursRes.json(),
      elevesRes.json()
    ]);
    
    return { professeurs, eleves };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};
//Messages
export const getMessages = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (!userId || !userRole) {
      console.warn("Utilisateur non identifié. Impossible de récupérer les messages.");
      return [];
    }
    
    console.log(`Récupération des messages pour ${userRole} ${userId}...`);
    const response = await fetch(`${API_URL}/messages/${userId}/${userRole}`);
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} lors de la récupération des messages`);
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return [];
  }
};
//Admin
export const getAdmins = async () => {
  try {
    const response = await fetch(`${API_URL}/admins`);
    
    // Si la route admin n'existe pas, retourner un tableau vide
    if (!response.ok) {
      console.warn(`Route /admins non disponible: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des administrateurs:', error);
    return [];
  }
};

// Nouvelle fonction pour les messages non lus
export const getUnreadMessagesCount = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (!userId || !userRole) {
      console.warn("Utilisateur non identifié. Impossible de compter les messages non lus.");
      return { count: 0 };
    }
    
    // Tentative d'utiliser l'API dédiée
    try {
      const response = await fetch(`${API_URL}/messages/unread/${userId}/${userRole}`);
      if (response.ok) {
        return await response.json();
      }
      
      console.warn("Route /unread non disponible, calcul manuel...");
    } catch (error) {
      console.warn("Erreur avec la route /unread, calcul manuel...", error);
    }
    
    // Méthode alternative : compter manuellement à partir de tous les messages
    const allMessages = await getMessages();
    const unreadCount = allMessages.filter(m => 
      m.receiverId === userId && !m.read
    ).length;
    
    return { count: unreadCount };
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error);
    return { count: 0 };
  }
};
//

//
export const sendMessageLocal = async (messageData) => {
  try {
    // Récupérer les messages existants
    const existingMessages = JSON.parse(localStorage.getItem('localMessages') || '[]');
    
    // Créer un nouveau message
    const newMessage = {
      ...messageData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false
    };
    
    // Ajouter le message et sauvegarder
    existingMessages.push(newMessage);
    localStorage.setItem('localMessages', JSON.stringify(existingMessages));
    
    return newMessage;
  } catch (error) {
    console.error('Erreur lors de l\'envoi local du message:', error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    if (!response.ok) throw new Error('Erreur réseau');
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Erreur réseau');
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du marquage du message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const response = await fetch(`${API_URL}/messages/${messageId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erreur réseau');
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    throw error;
  }
};
// Classes
export const getClasseById = async (classeId) => {
  try {
    // Ajouter userId et userRole à la requête
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/classes/${classeId}?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la classe (${response.status})`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la classe:', error);
    throw error;
  }
};

// Dans services/api.js
export const getProfesseurClasses = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Ajouter les paramètres d'authentification
    const response = await fetch(`${API_URL}/professeurs/${userId}/classes?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Classes récupérées:', data); // Log pour débogage
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return [];
  }
};

export const assignerClasse = async (professeurId, classeId) => {
  try {
    const response = await fetch(`${API_URL}/professeurs/assigner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ professeurId, classeId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la classe:', error);
    return { success: false };
  }
};

// Matières
export const getMatieresForProfesseur = async (professeurId) => {
  try {
    const response = await fetch(`${API_URL}/matieres/professeur/${professeurId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    return [];
  }
};
// Élèves
export const getElevesForClasse = async (classeId) => {
  try {
    if (!classeId) {
      throw new Error('ClasseId est requis');
    }
    
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Appel API getElevesForClasse:', {
      classeId,
      userId,
      userRole
    });
    
    const response = await fetch(`${API_URL}/eleves/classe/${classeId}?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des élèves:', error);
    throw error; // Propager l'erreur au lieu de retourner un tableau vide
  }
};

// Cours
export const uploadCours = async (formData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Vérifiez et ajoutez l'ID du professeur s'il n'est pas présent
    if (!formData.has('professeurId')) {
      formData.append('professeurId', userId);
    }
    
    // Log pour déboguer
    console.log('FormData contenu avant envoi:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    const response = await fetch(`${API_URL}/cours/upload?userId=${userId}&userRole=${userRole}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'upload du cours:', error);
    throw error;
  }
};

// Dans services/api.js
export const getCoursForClasse = async (classeId) => {
  try {
    // Vérifiez d'abord si classeId est défini
    if (!classeId) {
      console.warn('ID de classe non défini, récupération de tous les cours');
      
      // Si classeId est vide, récupérer tous les cours disponibles à la place
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/cours?userId=${userId}&userRole=${userRole}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    }
    
    // Le reste du code reste inchangé...
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const timestamp = new Date().getTime();
    
    const url = `${API_URL}/cours/classe/${classeId}?userId=${userId}&userRole=${userRole}&t=${timestamp}`;
    console.log('URL de requête cours:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Accès refusé. Vous n'avez pas accès aux cours de cette classe.");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    throw error;
  }
};
// Notes

export const ajouterNote = async (noteData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/notes?userId=${userId}&userRole=${userRole}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la note:', error);
    throw error;
  }
};

export const getNotesForEleve = async (eleveId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/notes/eleve/${eleveId}?userId=${userId}&userRole=${userRole}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    // Normaliser les données ici pour garantir un format cohérent
    // Cette normalisation peut également être faite dans les composants individuels
    // comme nous l'avons fait précédemment
    const normalizedData = normalizeNotes(rawData);
    
    return normalizedData;
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    throw error;
  }
};

const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];
  
  return notes.map(note => {
    // Essayer d'obtenir une valeur numérique à partir de note.note
    let noteValue = parseFloat(note.note);
    
    // Si note.note n'est pas un nombre valide, essayer d'utiliser note.valeur
    if (isNaN(noteValue) && note.valeur !== undefined) {
      noteValue = parseFloat(note.valeur);
    }
    
    // Identifier le type de note (exercice ou standard)
    const noteType = note.exerciceId ? 'exercice' : 'standard';
    
    // Construire un objet note normalisé
    return {
      ...note,
      note: noteValue,
      noteType: noteType,
      // Si on veut conserver la valeur originale
      originalValue: note.valeur !== undefined ? note.valeur : note.note
    };
  }).filter(note => !isNaN(note.note)); // Supprimer les notes non numériques
};

// Notes
export const getNotesForClasse = async (classeId, matiereId) => {
  try {
    const professeurId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Requête notes pour:', { classeId, matiereId, professeurId, userRole });
    
    // Ajouter le paramètre userId au lieu de professeurId
    const url = `${API_URL}/notes/classe/${classeId}/matiere/${matiereId}?userId=${professeurId}&userRole=${userRole}`;
    console.log('URL de la requête:', url);
    
    const response = await fetch(url);
    
    // Afficher le statut de la réponse
    console.log('Statut de la réponse:', response.status);
    
    if (!response.ok) {
      // Tenter de lire le message d'erreur du serveur
      try {
        const errorData = await response.json();
        console.error('Message d\'erreur du serveur:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la récupération des notes');
      } catch (parseError) {
        throw new Error(`Erreur (${response.status}): Erreur lors de la récupération des notes`,parseError);
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur API détaillée:', error);
    throw error;
  }
};

export const updateNote = async (noteId, noteData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/notes/${noteId}?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/notes/${noteId}?userId=${userId}&userRole=${userRole}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error);
    throw error;
  }
};

// Nouvelles fonctions pour la gestion des cours
export const getCoursDetails = async (coursId) => {
  try {
    const response = await fetch(`${API_URL}/cours/${coursId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du cours:', error);
    throw error;
  }
};

export const deleteMatiere = async (matiereId) => {
  try {
    const response = await fetch(`${API_URL}/matieres/${matiereId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression de la matière:', error);
    throw error;
  }
};

export const updateCours = async (coursId, updateData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Récupérer les détails du cours d'abord pour déboguer
    const courseDetails = await fetch(`${API_URL}/cours/${coursId}?userId=${userId}&userRole=${userRole}`);
    const courseData = await courseDetails.json();
    console.log('Détails du cours à modifier:', courseData);
    console.log('ID Professeur connecté:', userId);
    console.log('Propriétaire du cours:', courseData.professeurId);
    
    const response = await fetch(`${API_URL}/cours/${coursId}?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur détaillée:', errorData);
      throw new Error(errorData.message || `Erreur ${response.status}: Impossible de modifier le cours`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cours:', error);
    throw error;
  }
};

export const updateMatiere = async (matiereId, updateData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Ajouter logs pour déboguer
    console.log('Mise à jour de la matière:', { matiereId, updateData, userId, userRole });
    
    const response = await fetch(`${API_URL}/matieres/${matiereId}?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      console.error('Erreur serveur:', errorData);
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la matière:', error);
    throw error;
  }
};

export const deleteCours = async (coursId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/cours/${coursId}?userId=${userId}&userRole=${userRole}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      throw new Error(errorData.message || `Erreur ${response.status}: Impossible de supprimer le cours`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error);
    throw error;
  }
};

// Fonction mise à jour pour récupérer les statistiques
export const getCoursWithStats = async (classeId) => {
  try {
    const response = await fetch(`${API_URL}/cours/classe/${classeId}`);
    const data = await response.json();
    return {
      cours: data.cours || [],
      statistics: data.statistics || { total: 0, countByMatiere: {} }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des cours et statistiques:', error);
    return { cours: [], statistics: { total: 0, countByMatiere: {} } };
  }
};

// Exercices
export const getAllExercices = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/exercices?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    return [];
  }
};
// Pour les exercices
export const getExercicesForClasse = async (classeId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    let url = `${API_URL}/exercices/classe/${classeId}?`;
    
    if (userRole === 'eleve') {
      url += `eleveId=${userId}&userRole=${userRole}`;
    } else if (userRole === 'professeur') {
      url += `professeurId=${userId}&userRole=${userRole}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Vous n'avez pas accès à ces exercices.");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

//Professeur 
// Professeurs
export const getAllProfesseurs = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/professeurs?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des professeurs:', error);
    return [];
  }
};

export const updateProfesseur = async (professeurId, updateData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/professeurs/${professeurId}?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour du professeur:', error);
    throw error;
  }
};

// Frais de scolarité
export const getFraisForEleve = async (eleveId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/frais/eleve/${eleveId}/frais?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des frais:', error);
    return {};
  }
};

export const updateFraisEleve = async (eleveId, fraisData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Utiliser la bonne URL
    const response = await fetch(`${API_URL}/frais/eleve/${eleveId}/frais?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fraisData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour des frais:', error);
    throw error;
  }
};

// Paramètres administratifs
export const getAdminSettings = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/admin/settings?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return {};
  }
};

export const updateAdminSettings = async (settingsData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/admin/settings?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }
};

export const uploadExercice = async (formData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Ajoutez l'ID du professeur au formData s'il n'est pas déjà présent
    if (!formData.has('professeurId')) {
      formData.append('professeurId', userId);
    }
    
    // Déboguer le contenu du formData
    console.log('Contenu du formData:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    const response = await fetch(`${API_URL}/exercices?userId=${userId}&userRole=${userRole}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      console.error('Erreur serveur:', errorData);
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'exercice:', error);
    throw error;
  }
};

export const getExerciceDetails = async (exerciceId) => {
  try {
    const response = await fetch(`${API_URL}/exercices/${exerciceId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'exercice:', error);
    throw error;
  }
};

export const updateExercice = async (exerciceId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/exercices/${exerciceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'exercice:', error);
    throw error;
  }
};

export const deleteExercice = async (exerciceId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/exercices/${exerciceId}?userId=${userId}&userRole=${userRole}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'exercice:', error);
    throw error;
  }
};

// Soumissions
export const soumettreExercice = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/exercices/soumettre`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la soumission de l\'exercice:', error);
    throw error;
  }
};


export const getSoumissionsForExercice = async (exerciceId) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/exercices/soumissions/${exerciceId}?userId=${userId}&userRole=${userRole}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Vous n'avez pas accès aux soumissions de cet exercice.");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions:', error);
    throw error;
  }
};

export const getSoumissionsForEleve = async (eleveId) => {
  try {
    const response = await fetch(`${API_URL}/exercices/soumissions/eleve/${eleveId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions de l\'élève:', error);
    return [];
  }
};

export const noterSoumission = async (soumissionId, noteData) => {
  try {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    const response = await fetch(`${API_URL}/exercices/soumissions/${soumissionId}/noter?userId=${userId}&userRole=${userRole}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la notation de la soumission:', error);
    throw error;
  }
};

export const downloadExerciseSubmission = (soumissionId) => {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  
  window.open(`${API_URL}/exercices/soumissions/${soumissionId}/download?userId=${userId}&userRole=${userRole}`, '_blank');
};
// Statistiques
export const getExercicesStats = async (classeId) => {
  try {
    const response = await fetch(`${API_URL}/exercices/stats/classe/${classeId}`);
    const data = await response.json();
    return {
      total: data.total || 0,
      soumis: data.soumis || 0,
      enAttente: data.enAttente || 0,
      corriges: data.corriges || 0,
      parMatiere: data.parMatiere || {}
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return { total: 0, soumis: 0, enAttente: 0, corriges: 0, parMatiere: {} };
  }
};

// Dans votre fonction d'API
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Aucun token de rafraîchissement disponible');
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Échec du rafraîchissement du token');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data.token;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    throw error;
  }
};