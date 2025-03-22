// pages/parent/ParentCours.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Info,
  Calendar, Clock, CheckCircle, FileText,
  Filter, Book, Search,
  ChevronDown, Grid3X3, List, Archive
} from 'lucide-react';
import { API_URL } from '../../config/api.config';

function ParentCours() {
  const [cours, setCours] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [eleve, setEleve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const { eleveId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const headers = { 'Authorization': `Bearer ${token}` };
  
        // Récupérer les infos de l'élève
        const eleveRes = await fetch(`${API_URL}/eleves/${eleveId}`, { headers });
        const eleveData = await eleveRes.json();
        setEleve(eleveData);
  
        // Récupérer les cours et exercices de la classe de l'élève
        if (eleveData.classeId) {
          const [coursRes, exercicesRes] = await Promise.all([
            fetch(`${API_URL}/cours/classe/${eleveData.classeId}?userId=${userId}&userRole=${userRole}`, { headers }),
            fetch(`${API_URL}/exercices/classe/${eleveData.classeId}?eleveId=${eleveId}&userId=${userId}&userRole=${userRole}`, { headers })
          ]);
  
          if (coursRes.ok) {
            const coursData = await coursRes.json();
            const coursArray = Array.isArray(coursData) ? coursData : (coursData.cours || []);
            setCours(coursArray);
            
            // Extraire les matières uniques à partir des cours
            const uniqueMatieres = [];
            const matiereIds = new Set();
            
            coursArray.forEach(cours => {
              if (cours.matiereId && !matiereIds.has(cours.matiereId)) {
                matiereIds.add(cours.matiereId);
                uniqueMatieres.push({
                  id: cours.matiereId,
                  nom: cours.matiereName || `Matière ${cours.matiereId}`
                });
              }
            });
            
            setMatieres(uniqueMatieres);
          } else {
            setCours([]);
          }
  
          if (exercicesRes.ok) {
            const exercicesData = await exercicesRes.json();
            setExercices(Array.isArray(exercicesData) ? exercicesData : []);
          } else {
            setExercices([]);
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
        setCours([]);
        setExercices([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [eleveId]);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Filtrer les cours
  const filteredCours = cours.filter(cours => {
    const matchesSearch = cours.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (cours.description && cours.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMatiere = !selectedMatiere || cours.matiereId === selectedMatiere;
    
    return matchesSearch && matchesMatiere;
  });
  
  // Trier les cours par date (plus récent d'abord)
  const sortedCours = [...filteredCours].sort((a, b) => new Date(b.dateUpload) - new Date(a.dateUpload));
  
  // Trier les exercices par date limite, avec les exercices à faire en premier
  const sortedExercices = [...exercices].sort((a, b) => {
    // Prioriser les exercices non soumis
    if (!a.soumis && b.soumis) return -1;
    if (a.soumis && !b.soumis) return 1;
    
    // Puis trier par date limite
    if (a.dateLimit && b.dateLimit) {
      return new Date(a.dateLimit) - new Date(b.dateLimit);
    }
    
    if (a.dateLimit) return -1;
    if (b.dateLimit) return 1;
    
    // Si pas de date limite, trier par date d'upload
    return new Date(b.dateUpload) - new Date(a.dateUpload);
  });

  // Calculer la date limite restante
  const getRemainingTime = (dateLimit) => {
    if (!dateLimit) return null;
    
    const now = new Date();
    const limitDate = new Date(dateLimit);
    const diffTime = limitDate - now;
    
    if (diffTime <= 0) return 'Délai dépassé';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Demain";
    } else {
      return `${diffDays} jours restants`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-700">Chargement des cours...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/parent" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-2 bg-white rounded-xl shadow-sm transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cours et devoirs - {eleve?.nom}
          </h1>
          <p className="text-gray-500">
            Classe: {eleve?.classe || eleve?.classeId}
          </p>
        </div>
        
        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Supports de cours</h2>
              <p className="text-gray-500 text-sm">Accédez à tous les documents pédagogiques</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                  className="pl-10 pr-9 py-2.5 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none"
                >
                  <option value="">Toutes les matières</option>
                  {matieres.map((matiere) => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                  }`}
                  aria-label="Vue en grille"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                  }`}
                  aria-label="Vue en liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <Book className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <span className="text-sm text-blue-700 font-medium">Cours</span>
              <p className="text-2xl font-bold text-blue-800">{cours.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <span className="text-sm text-green-700 font-medium">Devoirs</span>
              <p className="text-2xl font-bold text-green-800">{exercices.length}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <span className="text-sm text-red-700 font-medium">À rendre</span>
              <p className="text-2xl font-bold text-red-800">{exercices.filter(ex => !ex.soumis).length}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <Archive className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <span className="text-sm text-purple-700 font-medium">Matières</span>
              <p className="text-2xl font-bold text-purple-800">{matieres.length}</p>
            </div>
          </div>
          
          {/* Indicateur de résultats de recherche */}
          {searchTerm || selectedMatiere ? (
            <div className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                {filteredCours.length} cours trouvés
              </p>
              {(searchTerm || selectedMatiere) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedMatiere('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 bg-blue-100 px-2 py-1 rounded-lg"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : null}
        </div>
        
        {/* Liste des cours */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Documents disponibles</h2>
          
          {sortedCours.length === 0 ? (
            <div className="bg-blue-50 p-6 rounded-xl text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                <Book className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-blue-700 mb-1">Aucun cours disponible</h3>
              <p className="text-blue-600 text-sm">
                {searchTerm || selectedMatiere 
                  ? "Aucun cours ne correspond à votre recherche."
                  : "Aucun cours n'est disponible pour le moment."}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCours.map(cours => (
                <div key={cours.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">{cours.titre}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {cours.matiereName || 'Non spécifié'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {cours.description || "Aucune description fournie."}
                    </p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(cours.dateUpload)}
                      </div>
                      <a
                      
                        href={`http://localhost:5000/${cours.filepath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Télécharger
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedCours.map(cours => (
                <div key={cours.id} className="py-4 flex items-center hover:bg-gray-50 rounded-lg px-2 transition-colors">
                  <div className="mr-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Book className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{cours.titre}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {cours.matiereName || 'Non spécifié'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(cours.dateUpload)}
                      </span>
                    </div>
                  </div>
                  <a
                  
                    href={`http://localhost:5000/${cours.filepath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Liste des exercices */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Devoirs et exercices</h2>
          
          {exercices.length === 0 ? (
            <div className="bg-green-50 p-6 rounded-xl text-center">
              <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-medium text-green-700 mb-1">Aucun devoir disponible</h3>
              <p className="text-green-600 text-sm">
                Aucun devoir n&apos;est assigné pour le moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left tracking-wider">Devoir</th>
                    <th className="px-6 py-3 text-left tracking-wider">Matière</th>
                    <th className="px-6 py-3 text-left tracking-wider">Date limite</th>
                    <th className="px-6 py-3 text-left tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left tracking-wider">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedExercices.map(exercice => (
                    <tr key={exercice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-3 bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {exercice.titre}
                            </span>
                            {exercice.description && (
                              <span className="text-xs text-gray-500 line-clamp-1">
                                {exercice.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {exercice.matiereName || 'Non spécifiée'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {exercice.dateLimit ? (
                          <div>
                            <div className="flex items-center text-sm text-gray-700">
                              <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                              {formatDate(exercice.dateLimit)}
                            </div>
                            {!exercice.soumis && (
                              <div className="text-xs mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-500" />
                                <span className={`${
                                  getRemainingTime(exercice.dateLimit) === 'Délai dépassé' 
                                    ? 'text-red-600 font-medium' 
                                    : 'text-amber-600'
                                }`}>
                                  {getRemainingTime(exercice.dateLimit)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Non spécifiée</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {exercice.soumis ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Soumis
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 mr-1" />
                            À faire
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`http://localhost:5000/${exercice.filepath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Sujet</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Information pour les parents */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800 text-lg mb-2">Information aux parents</h3>
              <p className="text-blue-700 mb-2">
                Vous pouvez suivre l&apos;avancement scolaire de votre enfant en consultant régulièrement les documents et les devoirs disponibles.
              </p>
              <p className="text-blue-700">
                Pour toute question concernant le contenu des cours ou des devoirs, n&apos;hésitez pas à contacter directement les enseignants via la messagerie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentCours;
