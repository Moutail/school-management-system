import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Edit2, Eye, Trash2, X, Save } from 'lucide-react';
import { 
  getCoursForClasse,
  deleteCours,
  updateCours 
} from '../services/api';

function MatiereDetails() {
  const { matiereId } = useParams();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ titre: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const classeId = localStorage.getItem('classeId');
        
        if (!classeId) {
          console.error('ClasseId non trouvé');
          return;
        }

        const coursData = await getCoursForClasse(classeId, matiereId);
        setCours(coursData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [matiereId]);

  const handleViewDetails = (cours) => {
    setSelectedCours(cours);
    setEditData({ titre: cours.titre, description: cours.description || '' });
    setEditMode(false);
  };

  const handleDelete = async (coursId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await deleteCours(coursId);
        setCours(cours.filter(c => c.id !== coursId));
        setSelectedCours(null);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du cours');
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const updatedCours = await updateCours(selectedCours.id, editData);
      setCours(cours.map(c => c.id === selectedCours.id ? {...c, ...updatedCours} : c));
      setSelectedCours({...selectedCours, ...updatedCours});
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du cours');
    }
  };

  const CourseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          {editMode ? (
            <input
              type="text"
              value={editData.titre}
              onChange={(e) => setEditData({...editData, titre: e.target.value})}
              className="text-xl font-bold w-full mr-4 p-2 border rounded"
            />
          ) : (
            <h3 className="text-xl font-bold">{selectedCours.titre}</h3>
          )}
          <div className="flex items-center gap-2">
            {!editMode && (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Modifier"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(selectedCours.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  title="Supprimer"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
            <button
              onClick={() => {
                setSelectedCours(null);
                setEditMode(false);
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {editMode ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    rows="4"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save size={16} />
                    Enregistrer
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Description</h4>
                  <p className="mt-1 text-gray-600">
                    {selectedCours.description || "Aucune description"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Date d&apos;ajout</h4>
                  <p className="mt-1 text-gray-600">
                    {new Date(selectedCours.dateUpload).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => window.open(`/api/cours/download/${selectedCours.id}`, '_blank')}
                  className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Télécharger le fichier
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cours.map((cours) => (
            <div
              key={cours.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {cours.titre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(cours.dateUpload).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(cours)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                      title="Voir les détails"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => window.open(`/api/cours/download/${cours.id}`, '_blank')}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                      title="Télécharger"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
                {cours.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{cours.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedCours && <CourseModal />}
    </div>
  );
}

export default MatiereDetails;