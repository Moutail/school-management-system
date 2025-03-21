// src/components/NoteFormContainer.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getElevesForClasse, getMatieresForProfesseur } from '../services/api';
import NoteForm from './NoteForm';

function NoteFormContainer() {
  const { matiereId } = useParams();
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatiere, setSelectedMatiere] = useState(matiereId || '');
  
  // Récupérer l'ID de la classe depuis localStorage ou les paramètres
  const classeId = localStorage.getItem('classeId');
  const professeurId = localStorage.getItem('userId');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!classeId || !professeurId) {
        setError("Information de classe ou de professeur manquante");
        return;
      }
      
      try {
        setLoading(true);
        const [elevesData, matieresData] = await Promise.all([
          getElevesForClasse(classeId),
          getMatieresForProfesseur(professeurId)
        ]);
        
        setEleves(elevesData || []);
        setMatieres(matieresData || []);
        
        // Si matiereId est passé mais pas dans les paramètres, l'utiliser
        if (matiereId && !selectedMatiere) {
          setSelectedMatiere(matiereId);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError("Impossible de charger les données nécessaires");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classeId, professeurId, matiereId, selectedMatiere]);
  
  const handleMatiereChange = (newMatiereId) => {
    setSelectedMatiere(newMatiereId);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Erreur</h3>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/professeur/dashboard')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }
  
  // Filtrer les matières pour la classe sélectionnée
  const matieresForClasse = matieres.find(group => group.classeId === classeId)?.matieres || [];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-6">Gestion des notes</h1>
      <NoteForm
        classeId={classeId}
        eleves={eleves}
        matieres={[{ classeId, classeName: "Classe sélectionnée", matieres: matieresForClasse }]}
        selectedMatiere={selectedMatiere}
        onMatiereChange={handleMatiereChange}
      />
    </div>
  );
}

export default NoteFormContainer;
