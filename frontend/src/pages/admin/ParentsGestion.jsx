// pages/admin/ParentsGestion.jsx
import { useState, useEffect } from 'react';
import { Search, UserPlus, Save, X, Users } from 'lucide-react';
import { API_URL } from '../../config/api.config';

function ParentsGestion() {
  const [parents, setParents] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedEleves, setSelectedEleves] = useState([]);
  const [availableEleves, setAvailableEleves] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parentsRes, elevesRes] = await Promise.all([
          fetch(`${API_URL}/parents`),
          fetch(`${API_URL}/eleves`)
        ]);

        if (parentsRes.ok && elevesRes.ok) {
          const [parentsData, elevesData] = await Promise.all([
            parentsRes.json(),
            elevesRes.json()
          ]);

          setParents(parentsData);
          setEleves(elevesData);
        } else {
          console.error('Erreur lors du chargement des données');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openAssignModal = (parent) => {
    setSelectedParent(parent);
    
    // Préparer la liste des élèves déjà assignés
    const assignedElevesIds = parent.elevesIds || [];
    setSelectedEleves(assignedElevesIds);
    
    // Filtrer les élèves disponibles (tous les élèves)
    setAvailableEleves(eleves);
    
    setShowModal(true);
  };

  const handleSaveAssignments = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/admin/parent/${selectedParent.id}/assign-students?userId=${userId}&userRole=${userRole}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ elevesIds: selectedEleves })
      });

      if (response.ok) {
        // Mettre à jour localement
        setParents(parents.map(p => 
          p.id === selectedParent.id 
            ? { ...p, elevesIds: selectedEleves } 
            : p
        ));
        
        setShowModal(false);
        // Message de succès
        alert("Élèves assignés avec succès");
      } else {
        throw new Error("Erreur lors de l'assignation");
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de l'assignation des élèves");
    }
  };

  const toggleEleve = (eleveId) => {
    if (selectedEleves.includes(eleveId)) {
      setSelectedEleves(selectedEleves.filter(id => id !== eleveId));
    } else {
      setSelectedEleves([...selectedEleves, eleveId]);
    }
  };

  const filteredParents = parents.filter(parent => 
    parent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Parents</h1>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Liste des parents */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enfants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParents.map(parent => (
              <tr key={parent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{parent.nom[0]}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{parent.nom}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{parent.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{parent.telephone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {parent.elevesIds?.length || 0} enfant(s)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openAssignModal(parent)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Assigner des élèves"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredParents.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Aucun parent trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'assignation d'élèves */}
      {showModal && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Assigner des élèves à {selectedParent.nom}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Rechercher un élève..."
                className="w-full px-4 py-2 border rounded-lg"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  if (searchTerm === '') {
                    setAvailableEleves(eleves);
                  } else {
                    setAvailableEleves(
                      eleves.filter(eleve => 
                        eleve.nom.toLowerCase().includes(searchTerm)
                      )
                    );
                  }
                }}
              />
            </div>
            
            <div className="max-h-80 overflow-y-auto border rounded-lg mb-4">
              {availableEleves.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun élève disponible
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {availableEleves.map(eleve => (
                    <li 
                      key={eleve.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleEleve(eleve.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEleves.includes(eleve.id)}
                          onChange={() => {}} // Géré par le onClick du parent
                          className="mr-3 h-4 w-4 text-blue-600 rounded"
                        />
                        <div>
                          <p className="font-medium">{eleve.nom}</p>
                          <p className="text-sm text-gray-500">
                            {eleves.find(e => e.classeId === eleve.classeId)?.nom || "Classe non spécifiée"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Élèves sélectionnés:</strong> {selectedEleves.length}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedEleves.map(eleveId => {
                  const eleve = eleves.find(e => e.id === eleveId);
                  return eleve ? (
                    <span 
                      key={eleveId}
                      className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {eleve.nom}
                      <button 
                        onClick={() => toggleEleve(eleveId)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAssignments}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentsGestion;
