// src/components/ExerciceFormContainer.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatieresForProfesseur } from '../services/api';
import ExerciceForm from './ExerciceForm';
import { AlertCircle } from 'lucide-react';

function ExerciceFormContainer() {
  const { classeId } = useParams();
  const navigate = useNavigate();
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const professeurId = localStorage.getItem('userId');
  const effectiveClasseId = classeId || localStorage.getItem('classeId');

  useEffect(() => {
    const fetchData = async () => {
      if (!professeurId) {
        setError("ID du professeur non disponible. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const matieresData = await getMatieresForProfesseur(professeurId);
        
        // Filtrer les matières pour la classe sélectionnée si classeId est fourni
        if (effectiveClasseId) {
          const matieresClasse = [];
          matieresData.forEach(groupe => {
            if (groupe.classeId === effectiveClasseId) {
              matieresClasse.push(...groupe.matieres);
            }
          });
          setMatieres(matieresClasse);
        } else {
          // Aplatir la structure pour obtenir toutes les matières
          const allMatieres = [];
          matieresData.forEach(groupe => {
            if (groupe.matieres) {
              allMatieres.push(...groupe.matieres);
            }
          });
          setMatieres(allMatieres);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des matières:', error);
        setError("Impossible de charger les matières. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [professeurId, effectiveClasseId]);

  const handleMatiereChange = (matiereId) => {
    setSelectedMatiere(matiereId);
  };

  const handleExerciceSuccess = () => {
    // Rediriger vers la liste des exercices ou le tableau de bord
    navigate('/professeur/exercices');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => navigate('/professeur/dashboard')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Ajouter un nouvel exercice</h1>
      
      {!effectiveClasseId ? (
        <div className="p-6 bg-yellow-50 rounded-lg text-center mb-6">
          <p className="text-yellow-700">
            Veuillez d&apos;abord sélectionner une classe dans votre tableau de bord.
          </p>
          <button
            onClick={() => navigate('/professeur/dashboard')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      ) : (
        <ExerciceForm
          classeId={effectiveClasseId}
          matieres={matieres}
          selectedMatiere={selectedMatiere}
          onMatiereChange={handleMatiereChange}
          onSuccess={handleExerciceSuccess}
        />
      )}
    </div>
  );
}

export default ExerciceFormContainer;
