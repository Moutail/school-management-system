// pages/admin/ElevesGestion.jsx
import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, 
  Mail, Calendar, GraduationCap 
} from 'lucide-react';

function AdminElevesGestion() {
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEleve, setEditingEleve] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    dateNaissance: '',
    classeId: '',
    status: 'actif'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elevesRes, classesRes] = await Promise.all([
          fetch('http://localhost:5000/api/eleves'),
          fetch('http://localhost:5000/api/classes')
        ]);

        const [elevesData, classesData] = await Promise.all([
          elevesRes.json(),
          classesRes.json()
        ]);

        setEleves(elevesData);
        setClasses(classesData);
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
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      let url = `http://localhost:5000/api/eleves?userId=${userId}&userRole=${userRole}`;
      let method = 'POST';
      let body = formData;
      
      // Si on modifie un élève existant
      if (editingEleve) {
        url = `http://localhost:5000/api/eleves/${editingEleve.id}?userId=${userId}&userRole=${userRole}`;
        method = 'PUT';
        body = { ...formData };
        // On peut retirer le mot de passe si vide pour la modification
        if (body.password === '') {
          delete body.password;
        }
      }
  
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
  
      if (response.ok) {
        const updatedEleves = await fetch(`http://localhost:5000/api/eleves?userId=${userId}&userRole=${userRole}`).then(res => res.json());
        setEleves(updatedEleves);
        setShowModal(false);
        setFormData({
          nom: '',
          email: '',
          password: '',
          dateNaissance: '',
          classeId: '',
          status: 'actif'
        });
        setEditingEleve(null);
        alert(editingEleve ? 'Élève mis à jour avec succès' : 'Élève créé avec succès');
      } else {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP: ${response.status}` }));
        alert(`Erreur: ${errorData.message || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Une erreur est survenue lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) {
      try {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        const response = await fetch(`http://localhost:5000/api/eleves/${id}?userId=${userId}&userRole=${userRole}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erreur ${response.status}`);
        }
        
        // Mise à jour de l'état après suppression
        setEleves(eleves.filter(eleve => eleve.id !== id));
        alert("Élève supprimé avec succès");
        
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression: " + error.message);
      }
    }
  };

  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch = eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eleve.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClasse = !selectedClasse || eleve.classeId === selectedClasse;
    return matchesSearch && matchesClasse;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Date invalide
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Élèves</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouvel Élève
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Toutes les classes</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id}>{classe.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des élèves */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de naissance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEleves.map(eleve => (
              <tr key={eleve.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{eleve.nom[0]}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{eleve.nom}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="w-4 h-4 mr-2" />
                    {eleve.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {classes.find(c => c.id === eleve.classeId)?.nom || 'Non assigné'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(eleve.dateNaissance).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    eleve.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {eleve.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                  <button
                      onClick={() => {
                        setEditingEleve(eleve);
                        setFormData({
                          ...eleve,
                          dateNaissance: formatDateForInput(eleve.dateNaissance),
                          password: '' // Réinitialiser le mot de passe lors de l'édition
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eleve.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                     <button
                      onClick={() => {
                        setEditingEleve(eleve);
                        setFormData(eleve);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eleve.id)}
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
              {editingEleve ? 'Modifier l\'élève' : 'Nouvel élève'}
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

              {!editingEleve && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
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
                <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                <input
                  type="date"
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Classe</label>
                <select
                  value={formData.classeId}
                  onChange={(e) => setFormData({...formData, classeId: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>{classe.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEleve(null);
                    setFormData({
                      nom: '',
                      email: '',
                      password: '',
                      dateNaissance: '',
                      classeId: '',
                      status: 'actif'
                    });
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingEleve ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminElevesGestion;