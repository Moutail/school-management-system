// pages/admin/ClassesGestion.jsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { API_URL } from '../../config/api.config';
function ClassesGestionAdmin() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    anneeScolaire: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      setLoading(true);
      const response = await fetch(`${API_URL}/api/classes?userId=${userId}&userRole=${userRole}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Impossible de charger les classes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      // Créer l'URL avec les paramètres d'authentification
      const url = `${API_URL}/api/classes?userId=${userId}&userRole=${userRole}`;
      
      const response = await fetch(url, {
        method: editingClass ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingClass ? { ...formData, id: editingClass.id } : formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
  
      await fetchClasses();
      setShowModal(false);
      setFormData({ nom: '', niveau: '', anneeScolaire: '' });
      setEditingClass(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleDelete = async (classeId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) return;
  
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/api/classes/${classeId}?userId=${userId}&userRole=${userRole}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        fetchClasses();
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + (errorData.message || 'Échec de la suppression'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Classes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Classe
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(classe => (
          <div key={classe.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{classe.nom}</h3>
                <p className="text-gray-500">Niveau: {classe.niveau}</p>
                <p className="text-gray-500">Année: {classe.anneeScolaire}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingClass(classe);
                    setFormData(classe);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(classe.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>{classe.nombreEleves || 0} élèves</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingClass ? 'Modifier la Classe' : 'Nouvelle Classe'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Niveau</label>
                <input
                  type="text"
                  value={formData.niveau}
                  onChange={(e) => setFormData({...formData, niveau: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Année Scolaire</label>
                <input
                  type="text"
                  value={formData.anneeScolaire}
                  onChange={(e) => setFormData({...formData, anneeScolaire: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClass(null);
                    setFormData({ nom: '', niveau: '', anneeScolaire: '' });
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingClass ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassesGestionAdmin;
