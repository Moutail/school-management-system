import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Edit2, Download, Save, X, Trash2 } from 'lucide-react';

function CoursDetails({ cours, onUpdate, onClose, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCours, setEditedCours] = useState(cours);

  useEffect(() => {
    setEditedCours(cours);
  }, [cours]);

  const handleSave = async () => {
    try {
      await onUpdate(editedCours);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Détails du cours</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isEditing ? (
            // Mode édition
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={editedCours.titre}
                  onChange={(e) => setEditedCours(prev => ({ ...prev, titre: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editedCours.description}
                  onChange={(e) => setEditedCours(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            // Mode affichage
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Titre</h3>
                <p className="mt-1 text-lg">{cours.titre}</p>
              </div>
              {cours.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{cours.description}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date d&apos;ajout</h3>
                <p className="mt-1">
                  {new Date(cours.dateUpload).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-between">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedCours(cours);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
            <button
              onClick={() => onDelete(cours.id)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
          <button
            onClick={() => window.open(`/api/cours/download/${cours.id}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}

CoursDetails.propTypes = {
  cours: PropTypes.shape({
    id: PropTypes.string.isRequired,
    titre: PropTypes.string.isRequired,
    description: PropTypes.string,
    dateUpload: PropTypes.string.isRequired,
    filepath: PropTypes.string.isRequired,
    classeId: PropTypes.string.isRequired,
    matiereId: PropTypes.string,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default CoursDetails;