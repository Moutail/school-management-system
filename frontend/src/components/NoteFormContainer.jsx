// src/components/NoteFormContainer.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getElevesForClasse, getMatieresForProfesseur } from '../services/api';
import NoteForm from './NoteForm';

function NoteFormContainer() {
  const { matiereId } = useParams();
  const [eleves, setEleves] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const classeId = localStorage.getItem('classeId');
  const professeurId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchData = async () => {
      if (!classeId || !professeurId) return;

      try {
        setLoading(true);
        const [elevesData, matieresData] = await Promise.all([
          getElevesForClasse(classeId),
          getMatieresForProfesseur(professeurId)
        ]);

        setEleves(elevesData || []);
        setMatieres(matieresData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classeId, professeurId]);

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <NoteForm
      classeId={classeId}
      eleves={eleves}
      matieres={matieres}
      selectedMatiere={matiereId}
      onMatiereChange={() => {}} // Gérer le changement si nécessaire
    />
  );
}

export default NoteFormContainer;