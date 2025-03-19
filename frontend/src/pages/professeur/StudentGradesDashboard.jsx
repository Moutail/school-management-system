import { useState, useEffect } from 'react';
import { 
  Book, Calculator, TrendingUp, Download,
  Info, Search, AlertCircle, TrendingDown,
  Calendar, User, ChevronDown,
  BarChart2, ChevronLeft, ChevronRight,
  Award, FileText,
  Shield, Users
} from 'lucide-react';
import { 
  getElevesForClasse, 
  getClasseById,
  getNotesForEleve
} from '../../services/api';
import { API_URL } from '../../config/api.config';

// Utilisation des paramètres par défaut JavaScript au lieu de defaultProps
function StudentGradesDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coefficients, setCoefficients] = useState({});
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [matieres, setMatieres] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [eleveIndex, setEleveIndex] = useState(0);
  const [statsVisible, setStatsVisible] = useState(true);
  
  // Fonction pour normaliser les notes (provenant de différentes sources)
  const normalizeNotes = (notesArray) => {
    if (!Array.isArray(notesArray)) return [];
    
    return notesArray.map(note => {
      // Essayer d'extraire la valeur numérique de la note
      let noteValue = parseFloat(note.note);
      
      // Si note n'est pas valide, essayer d'utiliser valeur
      if (isNaN(noteValue) && note.valeur !== undefined) {
        noteValue = parseFloat(note.valeur);
      }
      
      return {
        ...note,
        // Utiliser une propriété standardisée pour la note
        note: noteValue,
        // Stocker le type de note pour référence
        sourceType: note.exerciceId ? 'exercice' : 'standard'
      };
    }).filter(note => !isNaN(note.note)); // Filtrer les notes non numériques
  };

  // Charger la liste des classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        const response = await fetch(`${API_URL}/classes?userId=${userId}&userRole=${userRole}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des classes');
        }
        
        const data = await response.json();
        console.log('Classes chargées:', data);
        setClasses(data);
        
        if (data.length > 0) {
          setSelectedClasse(data[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
        setError("Impossible de charger les classes. " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Charger les élèves et les matières quand une classe est sélectionnée
  useEffect(() => {
    const loadClassData = async () => {
      if (!selectedClasse) return;
      
      try {
        setLoading(true);
        setError(null);
    
        // Charger les élèves avec la fonction API importée
        const elevesData = await getElevesForClasse(selectedClasse);
        console.log('Données élèves chargées:', elevesData);
        const elevesList = Array.isArray(elevesData) ? elevesData : [];
        setEleves(elevesList);
        
        // Sélectionner automatiquement le premier élève si disponible
        if (elevesList.length > 0 && !selectedEleve) {
          setSelectedEleve(elevesList[0]);
          setEleveIndex(0);
        }
    
        // Charger les données de la classe avec la fonction API importée
        const classeData = await getClasseById(selectedClasse);
        console.log('Données classe chargées:', classeData);
        // S'assurer que matieres existe
        const matieresList = classeData?.matieres || [];
        setMatieres(matieresList);
      } catch (err) {
        console.error('Erreur:', err);
        setError("Erreur lors du chargement des données: " + err.message);
        setEleves([]);
        setMatieres([]);
      } finally {
        setLoading(false);
      }
    };
  
    loadClassData();
  }, [selectedClasse, selectedEleve]);

  // Charger les notes pour l'élève sélectionné
  useEffect(() => {
    const fetchNotes = async () => {
      if (!selectedEleve) {
        setFilteredNotes([]);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Tentative de chargement des notes pour élève:', selectedEleve.id);
        
        const notesData = await getNotesForEleve(selectedEleve.id);
        console.log('Notes chargées (brutes):', notesData);
        
        // Normaliser les notes avant de les utiliser
        const normalizedNotes = normalizeNotes(notesData);
        console.log('Notes normalisées:', normalizedNotes);
        
        // Vérifier si normalizedNotes est un tableau
        if (!Array.isArray(normalizedNotes)) {
          console.warn('Les données normalisées ne sont pas un tableau:', normalizedNotes);
          setFilteredNotes([]);
        } else {
          const filteredByPeriod = filterNotesByPeriod(normalizedNotes, selectedPeriod);
          setFilteredNotes(filteredByPeriod);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
        
        // Message d'erreur spécifique pour le code 403
        if (error.message && error.message.includes('403')) {
          setError("Vous n'avez pas l'autorisation d'accéder aux notes de cet élève.");
        } else {
          setError('Erreur lors du chargement des notes: ' + error.message);
        }
        
        setFilteredNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [selectedEleve, selectedPeriod]);

  const filterNotesByPeriod = (notes, period) => {
    if (period === 'all') return notes;
    
    const currentYear = new Date().getFullYear();
    const firstSemesterStart = new Date(currentYear, 8, 1); // Septembre
    const firstSemesterEnd = new Date(currentYear + 1, 1, 1); // Février

    return notes.filter(note => {
      // S'assurer que la date est valide
      const noteDate = new Date(note.date);
      if (isNaN(noteDate.getTime())) {
        console.warn('Date invalide pour la note:', note);
        return false;
      }
      
      if (period === 'semester1') {
        return noteDate >= firstSemesterStart && noteDate < firstSemesterEnd;
      }
      return noteDate >= firstSemesterEnd || noteDate < firstSemesterStart;
    });
  };

  const calculateWeightedAverage = (notes) => {
    if (!notes || notes.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    notes.forEach(note => {
      const matiereId = note.matiereId;
      const coefficient = coefficients[matiereId] || 1;
      totalWeight += coefficient;
      weightedSum += note.note * coefficient;
    });

    return totalWeight ? (weightedSum / totalWeight).toFixed(2) : 0;
  };

  // Obtenir les statistiques pour une matière
  const getMatiereStats = (matiereId) => {
    const notes = filteredNotes.filter(note => note.matiereId === matiereId);
    if (!notes || notes.length === 0) return null;

    // Toutes les notes devraient déjà être numériques grâce à normalizeNotes
    const validNotes = notes.map(note => note.note);
    if (validNotes.length === 0) return null;

    const sortedNotes = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      average: validNotes.reduce((acc, note) => acc + note, 0) / validNotes.length,
      highest: Math.max(...validNotes),
      lowest: Math.min(...validNotes),
      count: validNotes.length,
      trend: validNotes.length > 1 ? 
        sortedNotes[sortedNotes.length - 1].note > sortedNotes[0].note 
          ? 'up' 
          : sortedNotes[sortedNotes.length - 1].note < sortedNotes[0].note
            ? 'down'
            : 'stable'
        : 'stable'
    };
  };

  const getGradeColor = (note) => {
    if (isNaN(note)) return 'bg-gray-100 text-gray-800';
    if (note >= 16) return 'bg-green-100 text-green-800';
    if (note >= 14) return 'bg-blue-100 text-blue-800';
    if (note >= 12) return 'bg-teal-100 text-teal-800';
    if (note >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProgressColor = (moyenne) => {
    if (!moyenne) return 'bg-gray-300';
    if (moyenne >= 16) return 'bg-green-500';
    if (moyenne >= 14) return 'bg-blue-500';
    if (moyenne >= 12) return 'bg-teal-500';
    if (moyenne >= 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getProgressWidth = (moyenne) => {
    if (!moyenne) return '0%';
    return `${(moyenne / 20) * 100}%`;
  };

  const handleExport = () => {
    if (!selectedEleve || !filteredNotes.length) return;

    const data = {
      eleve: selectedEleve,
      periode: selectedPeriod,
      notes: filteredNotes,
      moyennes: matieres
        .filter(matiere => getMatiereStats(matiere.id)) // Ne garder que les matières qui ont des notes
        .map(matiere => ({
          matiere: matiere.nom,
          stats: getMatiereStats(matiere.id),
          coefficient: coefficients[matiere.id] || 1
        })),
      moyenneGenerale: calculateWeightedAverage(filteredNotes)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${selectedEleve.nom.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Déterminer les matières qui ont des notes
  const getMatieresWithNotes = () => {
    return matieres.filter(matiere => {
      const stats = getMatiereStats(matiere.id);
      return stats !== null;
    });
  };

  const matieresWithNotes = getMatieresWithNotes();
  
  // Navigation entre les élèves
  const goToNextEleve = () => {
    if (!eleves || eleves.length === 0) return;
    
    const nextIndex = (eleveIndex + 1) % eleves.length;
    setSelectedEleve(eleves[nextIndex]);
    setEleveIndex(nextIndex);
  };
  
  const goToPrevEleve = () => {
    if (!eleves || eleves.length === 0) return;
    
    const prevIndex = (eleveIndex - 1 + eleves.length) % eleves.length;
    setSelectedEleve(eleves[prevIndex]);
    setEleveIndex(prevIndex);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  };

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
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection de classe */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Notes des élèves</h2>
            {eleves && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {eleves.length} élève{eleves.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedClasse || ''}
              onChange={(e) => setSelectedClasse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setStatsVisible(!statsVisible)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={statsVisible ? "Masquer les statistiques" : "Afficher les statistiques"}
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              disabled={!selectedEleve || filteredNotes.length === 0}
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
        
        {/* Navigation entre élèves */}
        {selectedEleve && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevEleve}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Précédent</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-medium">
                    {selectedEleve.nom.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">{selectedEleve.nom}</h3>
                  <p className="text-sm text-gray-500">
                    {eleveIndex + 1} sur {eleves.length}
                  </p>
                </div>
              </div>
              
              <button
                onClick={goToNextEleve}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>Suivant</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toute l&lsquo;année</option>
              <option value="semester1">1er Semestre</option>
              <option value="semester2">2ème Semestre</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedEleve?.id || ''}
              onChange={(e) => {
                const eleve = eleves.find(el => el.id === e.target.value);
                if (eleve) {
                  setSelectedEleve(eleve);
                  setEleveIndex(eleves.findIndex(el => el.id === e.target.value));
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner un élève</option>
              {eleves
                .filter(eleve => eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(eleve => (
                  <option key={eleve.id} value={eleve.id}>
                    {eleve.nom}
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl shadow-md">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {selectedEleve ? (
            <>
              {/* Statistiques */}
              {statsVisible && filteredNotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Moyenne Générale</h3>
                      <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {calculateWeightedAverage(filteredNotes)}
                      </span>
                      <span className="text-gray-500">/20</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(calculateWeightedAverage(filteredNotes))}`}
                        style={{width: getProgressWidth(calculateWeightedAverage(filteredNotes))}}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Matières évaluées</h3>
                      <Book className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-green-600">
                        {matieresWithNotes.length}
                      </span>
                      <span className="text-gray-500">/{matieres.length}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {matieresWithNotes.length > 0 
                        ? `${Math.round((matieresWithNotes.length / matieres.length) * 100)}% des matières évaluées`
                        : "Aucune matière évaluée"}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Notes</h3>
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-purple-600">
                        {filteredNotes.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium text-green-600">{filteredNotes.filter(n => n.note >= 10).length}</span> réussies
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium text-red-600">{filteredNotes.filter(n => n.note < 10).length}</span> à améliorer
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tableau des notes par matière */}
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Résultats par matière
                  </h3>
                </div>
                
                {matieresWithNotes.length > 0 ? (
                  <div className="p-6">
                    <div className="space-y-6">
                      {matieresWithNotes.map(matiere => {
                        const stats = getMatiereStats(matiere.id);
                        if (!stats) return null;
                        
                        return (
                          <div key={matiere.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Book className="w-5 h-5 text-blue-600" />
                                </div>
                                <h4 className="font-medium text-gray-900">{matiere.nom}</h4>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={coefficients[matiere.id] || 1}
                                  onChange={(e) => setCoefficients({
                                    ...coefficients,
                                    [matiere.id]: Number(e.target.value) || 1
                                  })}
                                  className="w-16 text-center p-1 border rounded-lg bg-white"
                                  title="Coefficient"
                                />
                                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getGradeColor(stats.average)}`}>
                                  {stats.average.toFixed(2)}/20
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 mb-4">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getProgressColor(stats.average)}`}
                                  style={{width: getProgressWidth(stats.average)}}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Max: <b>{stats.highest.toFixed(1)}</b></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">Min: <b>{stats.lowest.toFixed(1)}</b></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span className="text-gray-600">Notes: <b>{stats.count}</b></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {stats.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : stats.trend === 'down' ? (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                                )}
                                <span className="text-gray-600">
                                  {stats.trend === 'up' ? 'En hausse' : 
                                   stats.trend === 'down' ? 'En baisse' : 
                                   'Stable'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => setShowDetails(showDetails === matiere.id ? null : matiere.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1.5"
                              >
                                <span>{showDetails === matiere.id ? 'Masquer les détails' : 'Voir les détails'}</span>
                                {showDetails === matiere.id ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              
                              {showDetails === matiere.id && (
                                <div className="mt-4 space-y-2">
                                  {filteredNotes
                                    .filter(note => note.matiereId === matiere.id)
                                    .map((note, idx) => (
                                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                        <div>
                                          <p className="font-medium text-gray-800">
                                            {note.titre || `Évaluation ${idx + 1}`}
                                          </p>
                                          <p className="text-xs text-gray-500">{formatDate(note.date)}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-sm font-medium ${getGradeColor(note.note)}`}>
                                          {note.note}/20
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                      <Info className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune note disponible</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {selectedPeriod !== 'all' 
                        ? `Aucune note pour la période sélectionnée.` 
                        : `Cet élève n'a pas encore de notes enregistrées.`}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">Sélectionnez un élève</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Choisissez un élève dans la liste pour consulter ses notes et ses statistiques
              </p>
              {eleves && eleves.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-amber-500" />
                    <p className="font-medium">Aucun élève disponible</p>
                  </div>
                  <p className="text-sm">
                    Aucun élève n&apos;est associé à votre compte professeur. Veuillez contacter l&apos;administration.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudentGradesDashboard;