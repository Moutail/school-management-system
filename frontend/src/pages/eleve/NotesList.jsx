import { useState, useEffect } from 'react';
import { 
  ChartBar, Filter, Calendar, MessageSquare, 
  TrendingUp, Search,  AlertCircle,
  BookOpen, ChevronDown, Award, X
} from 'lucide-react';
import { getNotesForEleve } from '../../services/api';

function NotesList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatiere, setSelectedMatiere] = useState('all');
  const [matieres, setMatieres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteStats, setNoteStats] = useState({
    best: 0,
    worst: 20,
    average: 0,
    above15: 0,
    below10: 0
  });

  // Fonction pour normaliser les notes
  const normalizeNotes = (notesData) => {
    return notesData.map(note => {
      // Convertir la note en nombre (peut être dans note ou valeur)
      let noteValue = parseFloat(note.note);
      
      // Si note n'est pas un nombre valide, essayer avec valeur
      if (isNaN(noteValue) && note.valeur !== undefined) {
        noteValue = parseFloat(note.valeur);
      }
      
      return {
        ...note,
        note: noteValue,
        // Garder la source originale pour affichage différent si nécessaire
        source: note.exerciceId ? 'exercice' : 'standard'
      };
    }).filter(note => !isNaN(note.note)); // Éliminer les notes qui ne sont pas des nombres
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour calculer les statistiques
  const calculateStats = (notesArray) => {
    if (notesArray.length === 0) return {
      best: 0,
      worst: 0,
      average: 0,
      above15: 0,
      below10: 0
    };
    
    let sum = 0;
    let best = 0;
    let worst = 20;
    let above15 = 0;
    let below10 = 0;
    
    notesArray.forEach(note => {
      const value = note.note;
      sum += value;
      best = Math.max(best, value);
      worst = Math.min(worst, value);
      
      if (value >= 15) above15++;
      if (value < 10) below10++;
    });
    
    return {
      best: best.toFixed(2),
      worst: worst.toFixed(2),
      average: (sum / notesArray.length).toFixed(2),
      above15,
      below10
    };
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const eleveId = localStorage.getItem('userId');
        if (!eleveId) {
          throw new Error("ID d'élève non trouvé");
        }
        
        // Récupérer les notes brutes
        const rawData = await getNotesForEleve(eleveId);
        
        // Normaliser les données
        const normalizedNotes = normalizeNotes(rawData);
        
        // Trier les notes par date (plus récentes d'abord)
        const sortedNotes = [...normalizedNotes].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        setNotes(sortedNotes);
        
        // Calculer les statistiques
        setNoteStats(calculateStats(sortedNotes));
        
        // Extraire les matières uniques avec leurs IDs
        const uniqueMatieres = Array.from(new Set(sortedNotes.map(note => 
          JSON.stringify({id: note.matiere?.id || note.matiereId, nom: note.matiere?.nom || `Matière ${note.matiereId}`})
        ))).map(str => JSON.parse(str));
        
        setMatieres(uniqueMatieres);
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
        setError(error.message || "Impossible de charger les notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filtrage des notes
  const filteredNotes = notes.filter(note => {
    const matchesMatiere = selectedMatiere === 'all' || 
      (note.matiere?.id || note.matiereId) === selectedMatiere;
    
    const matchesSearch = searchTerm === '' || 
      (note.matiere?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.titre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.commentaire || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesMatiere && matchesSearch;
  });

  const calculateMoyenne = (notes) => {
    if (notes.length === 0) return 0;
    const sum = notes.reduce((acc, note) => acc + note.note, 0);
    return (sum / notes.length).toFixed(2);
  };

  const getMoyenneColor = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    if (moyenneNum >= 16) return 'text-green-600';
    if (moyenneNum >= 14) return 'text-blue-600';
    if (moyenneNum >= 12) return 'text-teal-600';
    if (moyenneNum >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getNoteColor = (note) => {
    if (note >= 16) return 'bg-green-100 text-green-800';
    if (note >= 14) return 'bg-blue-100 text-blue-800';
    if (note >= 12) return 'bg-teal-100 text-teal-800';
    if (note >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement des notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const moyenneGenerale = calculateMoyenne(notes);
  const moyenneFiltered = calculateMoyenne(filteredNotes);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-12">
      {/* En-tête avec titre et filtres */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-2xl shadow-md p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Notes</h1>
          <p className="text-gray-500 mt-1">Suivi et analyse de vos résultats</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedMatiere}
              onChange={(e) => setSelectedMatiere(e.target.value)}
              className="pl-9 pr-9 py-2.5 w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none"
            >
              <option value="all">Toutes les matières</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Statistiques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moyenne générale */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ChartBar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Moyenne générale</h2>
                <p className="text-gray-500 text-sm">Sur tous vos résultats</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${getMoyenneColor(moyenneGenerale)}`}>
                  {moyenneGenerale}/20
                </p>
                {filteredNotes.length !== notes.length && (
                  <p className="text-sm text-gray-600 mt-1">
                    {moyenneFiltered}/20 pour la sélection actuelle
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {notes.length} note{notes.length > 1 ? 's' : ''} au total
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Statistiques détaillées</h2>
                <p className="text-gray-500 text-sm">Analyse de vos performances</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="text-center">
                <p className="text-sm text-gray-500">Meilleure note</p>
                <p className="text-xl font-bold text-green-600">{noteStats.best}/20</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Notes ≥ 15</p>
                <p className="text-xl font-bold text-blue-600">{noteStats.above15}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Notes inférieur à 10</p>
                <p className="text-xl font-bold text-red-600">{noteStats.below10}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des notes */}
      <div className="bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Liste des notes
            {filteredNotes.length > 0 && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {filteredNotes.length}
              </span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredNotes.map((note, index) => (
            <div 
              key={index} 
              className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {note.matiere?.nom || 'Matière non spécifiée'}
                    </h3>
                    {note.source === 'exercice' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Exercice
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(note.date)}
                    </div>
                    {note.titre && (
                      <div className="font-medium text-gray-700">
                        {note.titre}
                      </div>
                    )}
                    {note.commentaire && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>Commentaire disponible</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-3.5 py-1.5 rounded-xl font-medium ${getNoteColor(note.note)}`}>
                  {note.note}/20
                </div>
              </div>
            </div>
          ))}
          
          {filteredNotes.length === 0 && (
            <div className="p-12 text-center">
              <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <ChartBar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune note trouvée
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {selectedMatiere === 'all' && searchTerm === ''
                  ? "Vous n'avez pas encore de notes enregistrées."
                  : "Aucune note ne correspond à vos critères de recherche."}
              </p>
              {(selectedMatiere !== 'all' || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setSelectedMatiere('all');
                    setSearchTerm('');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de détail pour une note */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedNote.matiere?.nom || 'Matière'}
                  </h3>
                  <div className={`px-3 py-1 rounded-lg font-medium ${getNoteColor(selectedNote.note)}`}>
                    {selectedNote.note}/20
                  </div>
                </div>
                <p className="text-gray-500 mt-1">
                  {selectedNote.titre || `Note du ${formatDate(selectedNote.date)}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="bg-gray-50 p-4 rounded-xl flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Date
                  </h4>
                  <p className="font-medium text-gray-900">{formatDate(selectedNote.date)}</p>
                </div>
                
                {selectedNote.source === 'exercice' && (
                  <div className="bg-purple-50 p-4 rounded-xl flex-1 min-w-[200px]">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
                      Type
                    </h4>
                    <p className="font-medium text-gray-900">Exercice</p>
                  </div>
                )}
              </div>
              
              {selectedNote.commentaire && (
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                    Commentaire du professeur
                  </h4>
                  <p className="text-gray-800">{selectedNote.commentaire}</p>
                </div>
              )}
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-amber-500" />
                  Appréciation
                </h4>
                <p className="text-gray-800">
                  {selectedNote.note >= 16 && "Excellent travail ! Continuez ainsi."}
                  {selectedNote.note >= 14 && selectedNote.note < 16 && "Très bon travail. Les objectifs sont atteints."}
                  {selectedNote.note >= 12 && selectedNote.note < 14 && "Bon travail. Les fondamentaux sont maîtrisés."}
                  {selectedNote.note >= 10 && selectedNote.note < 12 && "Travail satisfaisant. Quelques points à approfondir."}
                  {selectedNote.note < 10 && "Des efforts supplémentaires sont nécessaires pour atteindre les objectifs."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesList;