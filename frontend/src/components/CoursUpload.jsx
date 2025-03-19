import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, Upload, Download, X, AlertCircle } from 'lucide-react';
import { uploadCours, getCoursForClasse, getProfesseurClasses } from '../services/api';
import MatiereForm from './MatiereForm';

function CoursUpload({ 
  onClose, 
  onSuccess, 
  classeId, 
  matieres = [], 
  selectedMatiere, 
  onMatiereChange, 
  onMatieresUpdate 
}) {
  const [file, setFile] = useState(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [coursList, setCoursList] = useState([]);
  const [showMatiereForm, setShowMatiereForm] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClasseId, setSelectedClasseId] = useState(classeId || '');

  // Charger les classes disponibles si classeId n'est pas fourni
  useEffect(() => {
    const fetchClasses = async () => {
      if (!classeId) {
        try {
          const classesData = await getProfesseurClasses();
          setClasses(classesData || []);
        } catch (error) {
          console.error('Erreur lors du chargement des classes:', error);
          setError('Impossible de charger les classes');
        }
      }
    };
    fetchClasses();
  }, [classeId]);

  // Mettre à jour selectedClasseId lorsque classeId change
  useEffect(() => {
    setSelectedClasseId(classeId || '');
  }, [classeId]);

  // Charger les cours existants
  useEffect(() => {
    const fetchCours = async () => {
      const effectiveClasseId = selectedClasseId || classeId;
      if (effectiveClasseId && selectedMatiere) {
        try {
          const data = await getCoursForClasse(effectiveClasseId);
          // Vérifier si data est un objet avec une propriété cours ou un tableau
          const coursData = Array.isArray(data) ? data : (data?.cours || []);
          // Filtrer par matière si nécessaire
          const filteredCours = selectedMatiere 
            ? coursData.filter(c => c.matiereId === selectedMatiere) 
            : coursData;
          
          setCoursList(filteredCours);
        } catch (error) {
          console.error('Erreur lors du chargement des cours:', error);
          setError('Impossible de charger les cours existants');
        }
      } else {
        setCoursList([]);
      }
    };
    fetchCours();
  }, [classeId, selectedClasseId, selectedMatiere]);

  const handleMatiereCreated = async () => {
    try {
      if (onMatieresUpdate) {
        await onMatieresUpdate();
      }
      setShowMatiereForm(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des matières:', error);
      setError('Erreur lors de la création de la matière');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    const effectiveClasseId = selectedClasseId || classeId;
    
    if (!file || !selectedMatiere || !titre) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!effectiveClasseId) {
      setError('Veuillez sélectionner une classe');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('cours', file);
    formData.append('classeId', effectiveClasseId);
    formData.append('matiereId', selectedMatiere);
    formData.append('titre', titre);
    formData.append('description', description || '');
    formData.append('professeurId', localStorage.getItem('userId'));

    // Log pour déboguer
    console.log('FormData contenu avant envoi:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      await uploadCours(formData);
      setFile(null);
      setTitre('');
      setDescription('');
      
      // Rafraîchir la liste des cours
      const data = await getCoursForClasse(effectiveClasseId);
      const coursData = Array.isArray(data) ? data : (data?.cours || []);
      const filteredCours = selectedMatiere 
        ? coursData.filter(c => c.matiereId === selectedMatiere) 
        : coursData;
      
      setCoursList(filteredCours);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      setError(error.message || 'Erreur lors de l\'upload du cours');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélection de la classe si non définie */}
      {!classeId && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Classe</h3>
            <select
              value={selectedClasseId}
              onChange={(e) => setSelectedClasseId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sélection de la matière */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Matière</h3>
          <button
            type="button"
            onClick={() => setShowMatiereForm(!showMatiereForm)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
          >
            {showMatiereForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle matière
              </>
            )}
          </button>
        </div>

        {showMatiereForm ? (
          <MatiereForm 
            classeId={selectedClasseId || classeId} 
            onMatiereCreated={handleMatiereCreated}
          />
        ) : (
          <select
            value={selectedMatiere || ''}
            onChange={(e) => onMatiereChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Sélectionner une matière</option>
            {matieres.map((matiere) => (
              <option key={matiere.id} value={matiere.id}>
                {matiere.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Formulaire d'upload */}
      {selectedMatiere && !showMatiereForm && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Ajouter un nouveau cours
            </h3>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du cours *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Description optionnelle du cours"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier *
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading || !file || !titre || (!classeId && !selectedClasseId)}
                  className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Envoyer le cours
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des cours existants */}
      {coursList.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cours disponibles
          </h3>
          <div className="space-y-3">
            {coursList.map((cours) => (
              <div 
                key={cours.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-200 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{cours.titre}</h4>
                  {cours.description && (
                    <p className="text-sm text-gray-500 mt-1">{cours.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Ajouté le {new Date(cours.dateUpload).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => window.open(`${window.location.origin}/api/cours/${cours.id}/download`, '_blank')}
                  className="ml-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  title="Télécharger"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

CoursUpload.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  classeId: PropTypes.string,
  matieres: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  })),
  selectedMatiere: PropTypes.string,
  onMatiereChange: PropTypes.func.isRequired,
  onMatieresUpdate: PropTypes.func.isRequired
};

export default CoursUpload;