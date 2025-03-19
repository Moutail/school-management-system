import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Trash2, Edit2, Eye, X } from 'lucide-react';
import { deleteMatiere, updateMatiere } from '../services/api';

function MatieresList({ matieres, onUpdate }) {
  const [editingMatiere, setEditingMatiere] = useState(null);
  const [editNom, setEditNom] = useState('');

  const handleDelete = async (matiereId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      try {
        await deleteMatiere(matiereId);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Erreur lors de la suppression de la matière:', error);
        alert('Erreur lors de la suppression de la matière');
      }
    }
  };

  const handleEdit = (matiere) => {
    setEditingMatiere(matiere);
    setEditNom(matiere.nom);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateMatiere(editingMatiere.id, { nom: editNom });
      if (onUpdate) onUpdate();
      setEditingMatiere(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de la matière');
    }
  };

  if (!Array.isArray(matieres) || matieres.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Aucune matière assignée pour le moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {matieres.map((classeGroup) => (
          <div key={classeGroup.classeId} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {classeGroup.classeName}
            </h3>
            <div className="grid gap-4">
              {classeGroup.matieres.map((matiere) => (
                <div
                  key={matiere.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{matiere.nom}</h4>
                      <p className="text-sm text-gray-500">
                        {matiere.nombreCours || 0} cours disponibles
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/matieres/${matiere.id}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Voir les détails"
                      >
                        <Eye size={20} />
                      </Link>
                      <button
                        onClick={() => handleEdit(matiere)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Modifier"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(matiere.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Supprimer"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'édition */}
      {editingMatiere && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Modifier la matière</h3>
              <button
                onClick={() => setEditingMatiere(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la matière
                </label>
                <input
                  type="text"
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMatiere(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

MatieresList.propTypes = {
  matieres: PropTypes.arrayOf(PropTypes.shape({
    classeId: PropTypes.string.isRequired,
    classeName: PropTypes.string.isRequired,
    matieres: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      nom: PropTypes.string.isRequired,
      nombreCours: PropTypes.number,
    })).isRequired,
  })).isRequired,
  onUpdate: PropTypes.func,
};

export default MatieresList;