import { useState } from 'react';
import PropTypes from 'prop-types';
import { PlusCircle } from 'lucide-react';

function MatiereForm({ classeId, onMatiereCreated }) {
  const [nom, setNom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
  
    setIsLoading(true);
    setError('');
  
    try {
      const professeurId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      // Ajouter les paramètres userId et userRole à l'URL
      const url = `http://localhost:5000/api/matieres?userId=${professeurId}&userRole=${userRole}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: nom.trim(),
          professeurId,
          classeId
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création de la matière');
      }
  
      const newMatiere = await response.json();
      setNom('');
      onMatiereCreated(newMatiere);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Ajouter une nouvelle matière
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="matiere-nom" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nom de la matière
          </label>
          <input
            id="matiere-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Mathématiques, Physique, Histoire..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !nom.trim()}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Création en cours...
            </span>
          ) : (
            <span className="flex items-center">
              <PlusCircle className="w-5 h-5 mr-2" />
              Ajouter la matière
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

MatiereForm.propTypes = {
  classeId: PropTypes.string.isRequired,
  onMatiereCreated: PropTypes.func.isRequired
};

export default MatiereForm;