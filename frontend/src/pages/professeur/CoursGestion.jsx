import { useState, useEffect } from 'react';
import { 
  Plus, Download, Trash2, Edit2, X, Save, BookOpen, 
  Search, Filter, Calendar, ChevronDown, 
  Tag, RefreshCw, AlertCircle, Folder
} from 'lucide-react';
import { 
  deleteCours, 
  updateCours,
  getMatieresForProfesseur,
  getProfesseurClasses  
} from '../../services/api';
import CoursUpload from '../../components/CoursUpload';
import { API_URL } from '../../config/api.config';

function CoursGestion() {
  const [cours, setCours] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingError, setFetchingError] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [editingCours, setEditingCours] = useState(null);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [classes, setClasses] = useState([]);
  const [classesMap, setClassesMap] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'name'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chargement initial des données
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setFetchingError(null);
        const professeurId = localStorage.getItem('userId');
        
        // Charger les classes
        const classesData = await getProfesseurClasses();
        setClasses(classesData || []);
        
        // Créer un map des classes pour un accès facile
        const classesMapTemp = {};
        classesData.forEach(classe => {
          classesMapTemp[classe.id] = classe;
        });
        setClassesMap(classesMapTemp);

        // Charger les matières
        const matieresResponse = await getMatieresForProfesseur(professeurId);
        let allMatieres = [];
        matieresResponse.forEach(groupe => {
          allMatieres = [...allMatieres, ...groupe.matieres];
        });
        setMatieres(allMatieres);

        // Charger tous les cours directement depuis l'API
        try {
          const response = await fetch(`${API_URL}/cours`);
          const coursData = await response.json();
          setCours(coursData);
        } catch (error) {
          console.error('Erreur lors du chargement des cours:', error);
          setCours([]);
          setFetchingError("Impossible de charger les cours. Veuillez réessayer.");
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setFetchingError("Une erreur est survenue lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`${API_URL}/cours`);
      const coursData = await response.json();
      setCours(coursData);
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des cours:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (coursId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    
    try {
      // Ajouter ces lignes pour déboguer
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      console.log('Tentative de suppression du cours:', coursId);
      console.log('Par utilisateur:', userId, 'Rôle:', userRole);
      
      // Récupérer d'abord les détails du cours pour vérifier le propriétaire
      try {
        const courseDetailsResponse = await fetch(`${API_URL}/cours/${coursId}?userId=${userId}&userRole=${userRole}`);
        const courseData = await courseDetailsResponse.json();
        console.log('Détails du cours à supprimer:', courseData);
        console.log('Propriétaire du cours:', courseData.professeurId);
        console.log('Utilisateur actuel:', userId);
      } catch (e) {
        console.error('Erreur lors de la récupération des détails du cours:', e);
      }
      
      await deleteCours(coursId);
      setCours(cours.filter(c => c.id !== coursId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du cours: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingCours) return;

    try {
      const updatedCours = await updateCours(editingCours.id, {
        titre: editingCours.titre,
        description: editingCours.description
      });

      setCours(cours.map(c => c.id === updatedCours.id ? updatedCours : c));
      setEditingCours(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du cours');
    }
  };

  const getMatiereName = (matiereId) => {
    const matiere = matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : 'Matière non trouvée';
  };

  const getClasseName = (classeId) => {
    return classesMap[classeId]?.nom || 'Classe non trouvée';
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    try {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      return 'Date invalide',e;
    }
  };

  // Filtrage des cours
  const filteredCours = cours.filter(c => {
    const matchesClasse = !selectedClasse || c.classeId === selectedClasse;
    const matchesMatiere = !selectedMatiere || c.matiereId === selectedMatiere;
    const matchesSearch = !searchTerm || c.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesClasse && matchesMatiere && matchesSearch;
  });

  // Tri des cours
  const sortedCours = [...filteredCours].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.dateUpload) - new Date(a.dateUpload);
    } else if (sortOrder === 'oldest') {
      return new Date(a.dateUpload) - new Date(b.dateUpload);
    } else {
      return a.titre.localeCompare(b.titre);
    }
  });

  // Obtenir une couleur pour la matière
  const getMatiereColor = (matiereId) => {
    const colorMap = {
      'mathematiques': 'bg-blue-100 text-blue-700',
      'francais': 'bg-red-100 text-red-700', 
      'histoire': 'bg-yellow-100 text-yellow-700',
      'sciences': 'bg-green-100 text-green-700',
      'anglais': 'bg-purple-100 text-purple-700',
      'geographie': 'bg-orange-100 text-orange-700',
      'physique': 'bg-teal-100 text-teal-700',
      'svt': 'bg-emerald-100 text-emerald-700',
      'default': 'bg-gray-100 text-gray-700'
    };
    
    // Récupérer le nom de la matière
    const matiere = matieres.find(m => m.id === matiereId);
    if (!matiere) return colorMap.default;
    
    // Rechercher une correspondance pour le nom de la matière (insensible à la casse)
    const nomMatiere = matiere.nom.toLowerCase();
    
    for (const [key, value] of Object.entries(colorMap)) {
      if (nomMatiere.includes(key)) {
        return value;
      }
    }
    
    return colorMap.default;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement des cours...</p>
        </div>
      </div>
    );
  }
  
    return (
      <div className="space-y-6 p-6">
        {/* En-tête avec titre et bouton d'ajout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Cours</h1>
            <p className="text-gray-500 mt-1">Organisez et partagez vos supports de cours avec vos élèves</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un cours
          </button>
        </div>
  
        {/* Filtres et options */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
  
            {/* Filtre par classe */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les classes</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
  
            {/* Filtre par matière */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedMatiere}
                onChange={(e) => setSelectedMatiere(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  
            {/* Options de tri */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Plus récents d&apos;abord</option>
                <option value="oldest">Plus anciens d&lsquo;abord</option>
                <option value="name">Ordre alphabétique</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
  
          {/* Options d'affichage et statistiques */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">
                {filteredCours.length} cours trouvé{filteredCours.length !== 1 ? 's' : ''}
              </span>
              <button 
                onClick={refreshData} 
                disabled={isRefreshing}
                className="ml-2 p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {fetchingError && (
                <span className="text-sm text-red-500 flex items-center ml-2">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fetchingError}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Vue en grille"
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Vue en liste"
              >
                <div className="w-5 h-5 flex flex-col justify-between">
                  <div className="h-1 bg-current rounded-sm"></div>
                  <div className="h-1 bg-current rounded-sm"></div>
                  <div className="h-1 bg-current rounded-sm"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
  
        {/* Liste des cours - Vue en grille */}
        {viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedCours.map((cours) => (
              <div
                key={cours.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Barre supérieure colorée */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                
                <div className="p-6">
                  {editingCours?.id === cours.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingCours.titre}
                        onChange={(e) => setEditingCours({...editingCours, titre: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Titre du cours"
                      />
                      <textarea
                        value={editingCours.description || ''}
                        onChange={(e) => setEditingCours({...editingCours, description: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Description (optionnelle)"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditingCours(null)}
                          className="flex items-center gap-1 px-3.5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-sm">Annuler</span>
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="flex items-center gap-1 px-3.5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span className="text-sm">Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{cours.titre}</h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getMatiereColor(cours.matiereId)}`}>
                              {getMatiereName(cours.matiereId)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Folder className="w-3.5 h-3.5 mr-1" />
                              {getClasseName(cours.classeId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(cours.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setEditingCours(cours)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                      
                      {cours.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{cours.description}</p>
                      )}
                      
                      <div className="mt-auto pt-4 flex justify-between items-center text-sm border-t border-gray-100">
                        <span className="text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                          {formatDate(cours.dateUpload)}
                        </span>
                        <button
                          onClick={() => window.open(`http://localhost:5000/${cours.filepath}`, '_blank')}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Vue en liste
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-gray-50 py-3.5 px-6 grid grid-cols-12 text-left text-xs font-medium text-gray-500 uppercase">
                <div className="col-span-5">Titre</div>
                <div className="col-span-2">Matière</div>
                <div className="col-span-2">Classe</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y divide-gray-100 bg-white">
                {sortedCours.map((cours) => (
                  <div key={cours.id} className="py-3 px-6 grid grid-cols-12 items-center hover:bg-gray-50">
                    <div className="col-span-5">
                      <h3 className="font-semibold text-gray-900">{cours.titre}</h3>
                      {cours.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cours.description}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getMatiereColor(cours.matiereId)}`}>
                        {getMatiereName(cours.matiereId)}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-700">
                      {getClasseName(cours.classeId)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">
                      {formatDate(cours.dateUpload)}
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <button
                        onClick={() => window.open(`http://localhost:5000/${cours.filepath}`, '_blank')}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingCours(cours)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cours.id)}
                        className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
  
        {/* Message si aucun cours n'est trouvé */}
        {sortedCours.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun cours trouvé</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {searchTerm || selectedClasse || selectedMatiere
                ? "Aucun cours ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de cours. Ajoutez votre premier cours en cliquant sur 'Ajouter un cours'."}
            </p>
            {(searchTerm || selectedClasse || selectedMatiere) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClasse('');
                  setSelectedMatiere('');
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
  
        {/* Modal d'upload */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Ajouter un nouveau cours</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <CoursUpload
                  onClose={() => setShowUploadModal(false)}
                  onSuccess={async () => {
                    try {
                      const professeurId = localStorage.getItem('userId');
                      const matieresResponse = await getMatieresForProfesseur(professeurId);
                      const allMatieres = [];
                      matieresResponse.forEach(groupe => {
                        allMatieres.push(...groupe.matieres);
                      });
                      setMatieres(allMatieres);
                      
                      // Recharger tous les cours
                      try {
                        const response = await fetch('http://localhost:5000/api/cours');
                        const coursData = await response.json();
                        setCours(coursData);
                      } catch (error) {
                        console.error('Erreur lors du rechargement des cours:', error);
                      }
                      setShowUploadModal(false);
                    } catch (error) {
                      console.error('Erreur lors du rafraîchissement des données:', error);
                      alert('Erreur lors du rafraîchissement des données');
                    }
                  }}
                  classeId={selectedClasse}
                  classes={classes}
                  matieres={matieres}
                  selectedMatiere={selectedMatiere}
                  onMatiereChange={setSelectedMatiere}
                  onMatieresUpdate={async () => {
                    try {
                      const professeurId = localStorage.getItem('userId');
                      const matieresResponse = await getMatieresForProfesseur(professeurId);
                      const allMatieres = [];
                      matieresResponse.forEach(groupe => {
                        allMatieres.push(...groupe.matieres);
                      });
                      setMatieres(allMatieres);
                      return true;
                    } catch (error) {
                      console.error('Erreur lors de la mise à jour des matières:', error);
                      return false;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  export default CoursGestion;
