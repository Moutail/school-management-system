// pages/admin/ProfesseursGestion.jsx
import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, 
  Mail, Book, GraduationCap, RefreshCw 
} from 'lucide-react';
import { API_URL } from '../../config/api.config';

function ProfesseursGestion() {
  const [professeurs, setProfesseurs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfesseur, setEditingProfesseur] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    matieres: [],
    status: 'actif'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [professeursRes, classesRes, matieresRes] = await Promise.all([
          fetch(`${API_URL}/professeurs`),
          fetch(`${API_URL}/classes`),
          fetch(`${API_URL}/matieres`)
        ]);

        const [professeursData, classesData, matieresData] = await Promise.all([
          professeursRes.json(),
          classesRes.json(),
          matieresRes.json()
        ]);

        setProfesseurs(professeursData);
        setClasses(classesData);
        setMatieres(matieresData);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Obtenez l'ID utilisateur et le rôle pour les paramètres d'authentification
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const url = editingProfesseur 
        ? `${API_URL}/professeurs/${editingProfesseur.id}?userId=${userId}&userRole=${userRole}`
        : `${API_URL}/professeurs?userId=${userId}&userRole=${userRole}`;
        
      const response = await fetch(url, {
        method: editingProfesseur ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProfesseur ? 
          { ...formData, id: editingProfesseur.id } : formData),
      });
  
      if (response.ok) {
        const updatedProfesseurs = await fetch(`${API_URL}/professeurs?userId=${userId}&userRole=${userRole}`)
          .then(res => res.json());
        setProfesseurs(updatedProfesseurs);
        setShowModal(false);
        resetForm();
        alert(editingProfesseur ? 'Professeur mis à jour avec succès' : 'Professeur créé avec succès');
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Une erreur est survenue: ${error.message}`);
    }
  };

  const handleDelete = async (professeurId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) return;
  
    try {
      // Récupérer l'ID utilisateur et le rôle pour les paramètres d'authentification
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/professeurs/${professeurId}?userId=${userId}&userRole=${userRole}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        setProfesseurs(professeurs.filter(prof => prof.id !== professeurId));
        alert('Professeur supprimé avec succès');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la suppression' }));
        alert(`Erreur: ${errorData.message || 'Échec de la suppression'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleResetPassword = async (professeurId) => {
    if (!confirm('Réinitialiser le mot de passe de ce professeur ?')) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/reset-password/professeur/${professeurId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('Mot de passe réinitialisé avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      password: '',
      matieres: [],
      status: 'actif'
    });
    setEditingProfesseur(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Professeurs</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nouveau Professeur
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un professeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Liste des professeurs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matières</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {professeurs
              .filter(prof => 
                prof.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prof.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(professeur => (
                <tr key={professeur.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {professeur.nom[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {professeur.nom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="w-4 h-4 mr-2" />
                      {professeur.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Book className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {professeur.matieres?.length || 0} matière(s)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {professeur.classes?.length || 0} classe(s)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      professeur.status === 'actif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {professeur.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProfesseur(professeur);
                          setFormData(professeur);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(professeur.id)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(professeur.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingProfesseur ? 'Modifier le professeur' : 'Nouveau professeur'}
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
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              {!editingProfesseur && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Matières
                </label>
                <select
                  multiple
                  value={formData.matieres}
                  onChange={(e) => setFormData({
                    ...formData,
                    matieres: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  {matieres.map(matiere => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                    Classes assignées
                </label>
                <select
                    multiple
                    value={formData.classes || []}
                    onChange={(e) => setFormData({
                    ...formData,
                    classes: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                    {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>
                        {classe.nom}
                    </option>
                    ))}
                </select>
                </div>
                <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProfesseur ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfesseursGestion;
