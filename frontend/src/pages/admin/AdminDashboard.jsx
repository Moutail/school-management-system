// pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { 
  Users, Book, School, FileText, 
  RefreshCw, 
  UserPlus, Trash2
} from 'lucide-react';

import AdminCreationForm from './AdminCreationForm';
import { API_URL } from '../../config/api.config';
function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProfesseurs: 0,
        totalEleves: 0,
        totalClasses: 0,
        totalCours: 0,
        totalExercices: 0,
        totalNotes: 0,
        professeursByClasse: {},
        elevesByClasse: {}
      });
    
  const [professeurs, setProfesseurs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dans votre composant
const [showAdminCreationForm, setShowAdminCreationForm] = useState(false);

const handleAdminCreated = (newAdmin) => {
  // Mettre à jour votre liste d'administrateurs
  console.log("Nouvel administrateur créé:", newAdmin);
  // Rafraîchir la liste des administrateurs ou ajouter le nouvel admin à la liste existante
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        // Ajouter les paramètres d'authentification à toutes les requêtes
        const authParams = `?userId=${userId}&userRole=${userRole}`;
        
        const [statsRes, professeursRes, classesRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/system-stats${authParams}`),
          fetch(`${API_URL}/api/professeurs${authParams}`),
          fetch(`${API_URL}/api/classes${authParams}`)
        ]);
    
        // Vérifier les erreurs pour chaque requête
        if (!statsRes.ok) {
          const errorData = await statsRes.json().catch(() => ({ message: `Erreur HTTP: ${statsRes.status}` }));
          throw new Error(`Erreur stats: ${errorData.message}`);
        }
        
        if (!professeursRes.ok || !classesRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }
    
        const [statsData, professeursData, classesData] = await Promise.all([
          statsRes.json(),
          professeursRes.json(),
          classesRes.json()
        ]);
    
        setStats(statsData);
        setProfesseurs(professeursData);
        setClasses(classesData);
      } catch (error) {
        console.error('Erreur:', error);
        // Afficher un message d'erreur à l'utilisateur
        alert(`Erreur lors du chargement des données: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetirerClasse = async (professeurId, classeId) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cette classe du professeur ?')) return;
    
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/api/admin/retirer-classe/${professeurId}/${classeId}?userId=${userId}&userRole=${userRole}`, {
        method: 'DELETE'
      });
  
      if (response.ok) {
        // Recharger les données
        alert('Classe retirée avec succès');
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status}` }));
        alert(`Erreur: ${errorData.message || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Une erreur est survenue: ${error.message}`);
    }
  };

  const handleAssignerClasse = async (professeurId, classeId) => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/api/admin/assigner-classe?userId=${userId}&userRole=${userRole}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ professeurId, classeId })
      });
  
      if (response.ok) {
        // Recharger les données
        alert('Classe assignée avec succès');
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP: ${response.status}` }));
        alert(`Erreur: ${errorData.message || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Une erreur est survenue: ${error.message}`);
    }
  };

  const handleResetPassword = async (userId, userType) => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe ?')) return;
  
    try {
      const adminId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(
        `${API_URL}/api/admin/reset-password/${userType}/${userId}?userId=${adminId}&userRole=${userRole}`,
        { method: 'POST' }
      );
  
      if (response.ok) {
        const data = await response.json();
        alert(`Mot de passe réinitialisé avec succès. Nouveau mot de passe: ${data.temporaryPassword}`);
      } else {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP: ${response.status}` }));
        alert(`Erreur: ${errorData.message || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Une erreur est survenue: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Administrateur</h1>

      <button
        onClick={() => setShowAdminCreationForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        <UserPlus className="w-5 h-5" />
        Nouvel administrateur
      </button>

      {showAdminCreationForm && (
        <AdminCreationForm 
          onClose={() => setShowAdminCreationForm(false)} 
          onSuccess={handleAdminCreated}
        />
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Professeurs</p>
              <p className="text-2xl font-bold">{stats.totalProfesseurs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <School className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Élèves</p>
              <p className="text-2xl font-bold">{stats.totalEleves}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-2xl font-bold">{stats.totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Total Cours</p>
              <p className="text-2xl font-bold">{stats.totalCours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gestion des Professeurs */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Gestion des Professeurs</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {professeurs.map(professeur => (
                <tr key={professeur.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{professeur.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{professeur.email}</td>
                  <td className="px-6 py-4">
                  <div className="space-y-2">
                    {/* Liste des classes assignées */}
                    <div className="space-y-1">
                      {professeur.classes && professeur.classes.length > 0 ? (
                        professeur.classes.map(classeId => {
                          const classe = classes.find(c => c.id === classeId);
                          return classe ? (
                            <div key={classeId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                              <span>{classe.nom}</span>
                              <button
                                onClick={() => handleRetirerClasse(professeur.id, classeId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <span className="text-gray-500 text-sm">Aucune classe assignée</span>
                      )}
                    </div>
                    
                    {/* Dropdown pour assigner une nouvelle classe */}
                    <select
                      className="border rounded px-2 py-1 w-full"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignerClasse(professeur.id, e.target.value);
                          e.target.value = ''; // Reset the dropdown
                        }
                      }}
                    >
                      <option value="">Assigner une classe</option>
                      {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>
                          {classe.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleResetPassword(professeur.id, 'professeur')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
