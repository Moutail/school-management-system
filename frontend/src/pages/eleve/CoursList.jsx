import { useState, useEffect } from 'react';
import { 
  FileText, Download, Book, Search, 
  Calendar, Filter, Info, AlertCircle, 
  X, ChevronDown, ChevronRight, Grid3X3,
  List, Clock, Star
} from 'lucide-react';
import { getCoursForClasse, getMatieresForProfesseur } from '../../services/api';

function CoursList() {
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [selectedCours, setSelectedCours] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const classeId = localStorage.getItem('classeId');
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
  
        if (!classeId) {
          throw new Error('Classe non trouvée');
        }
  
        // Charger les cours
        const coursResponse = await getCoursForClasse(classeId);
        setCours(Array.isArray(coursResponse.cours) ? coursResponse.cours : []);
  
        // Charger les matières selon le rôle
        let matieresPlates = [];
        
        if (userRole === 'professeur') {
          // Pour les professeurs, charger leurs matières spécifiques
          const matieresData = await getMatieresForProfesseur(userId);
          matieresPlates = matieresData.reduce((acc, groupe) => {
            if (groupe.matieres) {
              return [...acc, ...groupe.matieres];
            }
            return acc;
          }, []);
        } else {
          // Pour les élèves, charger toutes les matières de la classe
          const matieresResponse = await fetch(`http://localhost:5000/api/matieres/classe/${classeId}?userId=${userId}&userRole=${userRole}`);
          
          if (!matieresResponse.ok) {
            console.warn('Erreur lors du chargement des matières de la classe');
            // Au lieu d'échouer, collectons les matières à partir des cours
            const uniqueMatieres = new Map();
            coursResponse.cours.forEach(cours => {
              if (cours.matiereId && !uniqueMatieres.has(cours.matiereId)) {
                // Créer une entrée de matière à partir des données du cours
                uniqueMatieres.set(cours.matiereId, {
                  id: cours.matiereId,
                  nom: cours.matiereName || cours.matiereId // Utiliser le nom si disponible
                });
              }
            });
            matieresPlates = Array.from(uniqueMatieres.values());
          } else {
            matieresPlates = await matieresResponse.json();
          }
        }
        
        setMatieres(matieresPlates);
  
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const filteredCours = cours.filter(cours => {
    const matchesSearch = 
      cours.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cours.description && cours.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMatiere = !selectedMatiere || cours.matiereId === selectedMatiere;
    
    return matchesSearch && matchesMatiere;
  });

  // Fonction pour trier les cours par date (plus récent d'abord)
  const sortedCoursByDate = [...filteredCours].sort((a, b) => {
    return new Date(b.dateUpload) - new Date(a.dateUpload);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement des cours...</p>
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

  const getMatiereName = (matiereId) => {
    const matiere = matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : 'Matière inconnue';
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getMatiereColor = (matiereId) => {
    // Simple hashing function to get consistent colors
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
    ];
    
    // Convert matiereId to number or use the string length
    const numId = parseInt(matiereId) || matiereId.length;
    return colors[numId % colors.length];
  };

  return (
    <div className="space-y-6 px-4 py-6">
      {/* En-tête et filtres */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Cours</h1>
            <p className="text-gray-500 mt-1">Accédez à tous vos supports pédagogiques</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedMatiere}
                onChange={(e) => setSelectedMatiere(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none"
              >
                <option value="">Toutes les matières</option>
                {matieres.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Book className="w-5 h-5" />
              </div>
              <span className="font-medium">Total des cours</span>
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-3">{cours.length}</p>
          </div>
          <div className="bg-green-50 p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-green-700">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-medium">Matières</span>
            </div>
            <p className="text-2xl font-bold text-green-800 mt-3">{matieres.length}</p>
          </div>
          <div className="bg-purple-50 p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-purple-700">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-medium">Dernière mise à jour</span>
            </div>
            <p className="text-xl font-bold text-purple-800 mt-3">
              {cours.length > 0 
                ? formatDate(Math.max(...cours.map(c => new Date(c.dateUpload))))
                : 'Aucun cours'}
            </p>
          </div>
        </div>
        
        {/* Options d'affichage */}
        <div className="flex justify-between items-center mt-6 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">{filteredCours.length} cours trouvés</p>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'}`}
              title="Vue en grille"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'}`}
              title="Vue en liste"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCoursByDate.map((cours) => (
            <div
              key={cours.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Book className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {cours.titre}
                    </h2>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${getMatiereColor(cours.matiereId)}`}>
                        {getMatiereName(cours.matiereId)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(cours.dateUpload)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCours(cours)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                    title="Voir les détails"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>

                {cours.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {cours.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedCours(cours)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    Détails
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                  <button
                    onClick={() => window.open(`http://localhost:5000/${cours.filepath}`, '_blank')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="divide-y divide-gray-100">
            {sortedCoursByDate.map((cours) => (
              <div 
                key={cours.id}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl hidden sm:flex">
                    <Book className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{cours.titre}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${getMatiereColor(cours.matiereId)}`}>
                        {getMatiereName(cours.matiereId)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(cours.dateUpload)}
                      </span>
                    </div>
                    {cours.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                        {cours.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCours(cours)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Voir les détails"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => window.open(`http://localhost:5000/${cours.filepath}`, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      <span className="hidden sm:inline">Télécharger</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredCours.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun cours trouvé</h3>
          <p className="mt-1 text-gray-500 max-w-md mx-auto">
            {searchTerm || selectedMatiere
              ? "Aucun cours ne correspond à votre recherche. Essayez de modifier vos critères."
              : "Aucun cours n'est disponible pour le moment."}
          </p>
          {(searchTerm || selectedMatiere) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedMatiere('');
              }}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Modal de détails */}
      {selectedCours && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCours.titre}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${getMatiereColor(selectedCours.matiereId)}`}>
                    {getMatiereName(selectedCours.matiereId)}
                  </span>
                </div>
                <p className="text-gray-500 mt-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Mis en ligne le {formatDate(selectedCours.dateUpload)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCours(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-500" />
                  Description
                </h4>
                <p className="text-gray-800">{selectedCours.description || 'Aucune description disponible pour ce cours.'}</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-50 p-4 rounded-xl flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-amber-500" />
                    Matière
                  </h4>
                  <p className="font-medium text-gray-900">{getMatiereName(selectedCours.matiereId)}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-xl flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                    Date de mise en ligne
                  </h4>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedCours.dateUpload)}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end border-t border-gray-100">
                <button
                  onClick={() => window.open(`http://localhost:5000/${selectedCours.filepath}`, '_blank')}
                  className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le cours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursList;