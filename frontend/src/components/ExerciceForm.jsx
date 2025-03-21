// src/components/ExerciceForm.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  BookOpen, Calendar, Check, AlertCircle, Upload, X 
} from 'lucide-react';

function ExerciceForm({ 
  classeId, 
  matieres = [], 
  selectedMatiere, 
  onMatiereChange, 
  onSuccess,
  onClose 
}) {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [dateLimit, setDateLimit] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titre || !selectedMatiere || !file || !dateLimit) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('exercice', file);
    formData.append('classeId', classeId);
    formData.append('matiereId', selectedMatiere);
    formData.append('titre', titre);
    formData.append('description', description || '');
    formData.append('dateLimit', new Date(dateLimit).toISOString());
    formData.append('professeurId', localStorage.getItem('userId'));

    try {
      const response = await fetch('http://localhost:5000/api/exercices', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi de l\'exercice');
      }

      const data = await response.json();
      setSuccess('Exercice ajouté avec succès !');
      
      // Réinitialiser le formulaire
      setTitre('');
      setDescription('');
      setFile(null);
      setDateLimit('');
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Masquer le message de succès après quelques secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  // Calculer la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
          Ajouter un exercice
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Matière *
          </label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l&apos;exercice *
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex: Exercice sur les fonctions"
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
            placeholder="Instructions pour réaliser l'exercice..."
            rows="3"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fichier de l&apos;exercice *
          </label>
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
              Choisir un fichier
            </label>
            <span className="text-sm text-gray-500">
              {file ? file.name : 'Aucun fichier sélectionné'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Date limite de soumission *
          </label>
          <input
            type="date"
            value={dateLimit}
            onChange={(e) => setDateLimit(e.target.value)}
            min={today}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={uploading || !titre || !selectedMatiere || !file || !dateLimit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Publier l&apos;exercice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

ExerciceForm.propTypes = {
  classeId: PropTypes.string.isRequired,
  matieres: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  })),
  selectedMatiere: PropTypes.string,
  onMatiereChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onClose: PropTypes.func
};

export default ExerciceForm;
