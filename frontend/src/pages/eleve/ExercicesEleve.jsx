import { useState, useEffect } from 'react';
import { 
  Download, Upload, Clock, 
  CheckCircle, AlertCircle, BookOpen,
  Calendar, X, FileText,
  Search, Filter, CheckCheck, Eye,
  ChevronDown, Clock4, Award, MessageSquare
} from 'lucide-react';

function ExercicesEleve() {
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercice, setSelectedExercice] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedView, setSelectedView] = useState(null);

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non définie';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Vérifier si un exercice est en retard
  const isLate = (exercice) => {
    if (!exercice.dateLimit) return false;
    const now = new Date();
    const limitDate = new Date(exercice.dateLimit);
    return !exercice.soumis && now > limitDate;
  };

  // Calculer le temps restant
  const getRemainingTime = (dateLimit) => {
    if (!dateLimit) return null;
    
    const now = new Date();
    const limit = new Date(dateLimit);
    const diffTime = limit - now;
    
    if (diffTime <= 0) return 'Délai dépassé';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''}`;
    } else {
      return `${diffHours} heure${diffHours > 1 ? 's' : ''} restante${diffHours > 1 ? 's' : ''}`;
    }
  };

  // Obtenir le statut de l'exercice
  const getExerciceStatus = (exercice) => {
    if (exercice.note) return 'note';
    if (exercice.soumis) return 'soumis';
    if (isLate(exercice)) return 'retard';
    return 'attente';
  };

  useEffect(() => {
    const fetchExercices = async () => {
      try {
        const classeId = localStorage.getItem('classeId');
        const eleveId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');
        
        if (!classeId || !eleveId) {
          setError("Information de classe ou d'élève manquante");
          setLoading(false);
          return;
        }
            
        const response = await fetch(
          `http://localhost:5000/api/exercices/classe/${classeId}?eleveId=${eleveId}&userId=${eleveId}&userRole=${userRole}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Vous n'avez pas l'autorisation d'accéder à ces exercices");
          }
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // S'assurer que data est un tableau
        if (Array.isArray(data)) {
          // Trier les exercices : d'abord ceux qui ne sont pas soumis, triés par date limite croissante
          const sortedExercices = [...data].sort((a, b) => {
            // Comparaison par statut d'abord
            if (!a.soumis && b.soumis) return -1;
            if (a.soumis && !b.soumis) return 1;
            
            // Ensuite, pour les non soumis, par date limite
            if (!a.soumis && !b.soumis) {
              if (a.dateLimit && b.dateLimit) {
                return new Date(a.dateLimit) - new Date(b.dateLimit);
              }
              if (a.dateLimit) return -1;
              if (b.dateLimit) return 1;
            }
            
            // Pour les soumis, les plus récents d'abord
            return new Date(b.dateUpload || 0) - new Date(a.dateUpload || 0);
          });
          
          setExercices(sortedExercices);
        } else {
          console.warn("Les données reçues ne sont pas un tableau:", data);
          setExercices([]); // Initialiser avec un tableau vide
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError("Impossible de récupérer les exercices");
      } finally {
        setLoading(false);
      }
    };
  
    fetchExercices();
  }, []);

  const handleSubmitExercice = async (exerciceId) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('exerciceId', exerciceId);
    formData.append('eleveId', localStorage.getItem('userId'));

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/exercices/soumettre', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Mettre à jour l'état local
        const updatedExercices = exercices.map(ex => {
          if (ex.id === exerciceId) {
            return { ...ex, soumis: true };
          }
          return ex;
        });
        setExercices(updatedExercices);
        setSelectedExercice(null);
        setFile(null);
        // Afficher un message de succès (à implémenter)
      } else {
        throw new Error("Erreur lors de la soumission");
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de la soumission de l'exercice");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les exercices
  const filteredExercices = exercices.filter(ex => {
    const matchesSearch = 
      ex.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return getExerciceStatus(ex) === statusFilter && matchesSearch;
  });

  // Extraire des statistiques
  const stats = {
    total: exercices.length,
    soumis: exercices.filter(ex => ex.soumis).length,
    enAttente: exercices.filter(ex => !ex.soumis && !isLate(ex)).length,
    enRetard: exercices.filter(ex => isLate(ex)).length,
    notes: exercices.filter(ex => ex.note).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement des exercices...</p>
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

  return (
    <div className="max-w-5xl mx-auto p-4 pb-16 space-y-6">
      {/* En-tête avec titre et filtres */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Exercices</h1>
            <p className="text-gray-500 mt-1">Travaux et devoirs à rendre</p>
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-9 py-2.5 w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="attente">À faire</option>
                <option value="soumis">Soumis</option>
                <option value="retard">En retard</option>
                <option value="note">Notés</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-600 font-medium">À faire</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.enAttente}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <p className="text-sm text-green-600 font-medium">Soumis</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.soumis}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Notés</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{stats.notes}</p>
          </div>
        </div>
      </div>

      {/* Liste des exercices */}
      {filteredExercices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun exercice trouvé</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? "Aucun exercice ne correspond à vos critères de recherche."
              : "Vous n'avez pas d'exercices à faire pour le moment."}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercices.map(exercice => (
            <div 
              key={exercice.id} 
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              {/* Indicateur de statut */}
              <div className={`h-2 ${
                exercice.note 
                  ? 'bg-gradient-to-r from-green-400 to-green-500' // Noté
                  : exercice.soumis 
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500' // Soumis
                    : isLate(exercice)
                      ? 'bg-gradient-to-r from-red-400 to-red-500' // En retard
                      : 'bg-gradient-to-r from-amber-400 to-amber-500' // À faire
              }`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{exercice.titre}</h3>
                  <div className="flex items-center">
                    {exercice.note ? (
                      <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-xl">
                        <CheckCheck className="w-4 h-4" />
                        <span className="font-medium text-sm">Noté</span>
                      </div>
                    ) : exercice.soumis ? (
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Soumis</span>
                      </div>
                    ) : isLate(exercice) ? (
                      <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-xl">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Retard</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">À faire</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{exercice.description || "Aucune description fournie."}</p>

                {exercice.dateLimit && (
                  <div className="flex items-center gap-2 text-gray-700 mb-4 bg-gray-50 p-3 rounded-xl">
                    <Clock4 className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Date limite: {formatDate(exercice.dateLimit)}
                      </p>
                      {!exercice.soumis && (
                        <p className={`text-xs ${isLate(exercice) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {getRemainingTime(exercice.dateLimit)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-6">
                  {/* Bouton de téléchargement du sujet */}
                  <a
                    href={`http://localhost:5000/${exercice.filepath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le sujet
                  </a>

                  {/* Bouton de soumission si pas encore soumis */}
                  {!exercice.soumis && (
                    <button
                      onClick={() => setSelectedExercice(exercice)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm w-full"
                    >
                      <Upload className="w-4 h-4" />
                      Soumettre ma réponse
                    </button>
                  )}

                  {/* Bouton de téléchargement de la soumission si l'exercice a été soumis */}
                  {exercice.soumis && exercice.filepath_soumission && (
                    <a 
                      href={`http://localhost:5000/${exercice.filepath_soumission}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors w-full"
                    >
                      <Download className="w-4 h-4 text-green-600" />
                      Télécharger ma soumission
                    </a>
                  )}
                  
                  {/* Bouton pour voir les détails */}
                  <button
                    onClick={() => setSelectedView(exercice)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors w-full mt-1"
                  >
                    <Eye className="w-4 h-4" />
                    Voir les détails
                  </button>
                </div>

                {/* Affichage de la note si corrigé - dans la carte */}
                {exercice.note && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">Note :</span>
                      <span className="text-lg font-bold text-green-700 bg-white px-3 py-1 rounded-lg">
                        {exercice.note}/20
                      </span>
                    </div>
                    {exercice.commentaire && (
                      <div className="mt-2 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-green-800 font-medium">Commentaire :</p>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">{exercice.commentaire}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de soumission */}
      {selectedExercice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Soumettre ma réponse
                </h2>
                <button 
                  onClick={() => {
                    setSelectedExercice(null);
                    setFile(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-1">{selectedExercice.titre}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedExercice.description}</p>
                
                {selectedExercice.dateLimit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Date limite : {formatDate(selectedExercice.dateLimit)}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier de réponse
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-2">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-100 p-3 rounded-full mb-2">
                          <Upload className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="font-medium text-gray-800">Choisir un fichier</p>
                        <p className="text-sm text-gray-500 mt-1">Cliquez ou glissez-déposez un fichier</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedExercice(null);
                    setFile(null);
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSubmitExercice(selectedExercice.id)}
                  disabled={!file}
                  className={`px-4 py-2.5 rounded-xl text-white font-medium shadow-sm ${
                    file 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Soumettre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation détaillée */}
      {selectedView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedView.titre}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Créé le {formatDate(selectedView.dateUpload)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedView(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                    Description
                  </h3>
                  <p className="text-gray-800">{selectedView.description || "Aucune description fournie."}</p>
                </div>
                
                {/* Informations de dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      Date de création
                    </h3>
                    <p className="font-medium text-gray-900">{formatDate(selectedView.dateUpload)}</p>
                  </div>
                  
                  {selectedView.dateLimit && (
                    <div className="bg-amber-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-600" />
                        Date limite
                      </h3>
                      <p className="font-medium text-gray-900">{formatDate(selectedView.dateLimit)}</p>
                      {!selectedView.soumis && (
                        <p className={`text-xs mt-1 ${isLate(selectedView) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {getRemainingTime(selectedView.dateLimit)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Statut et actions */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Statut et actions
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                      selectedView.note 
                        ? 'bg-green-100 text-green-800' 
                        : selectedView.soumis 
                          ? 'bg-blue-100 text-blue-800'
                          : isLate(selectedView)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedView.note 
                        ? 'Noté' 
                        : selectedView.soumis 
                          ? 'Soumis'
                          : isLate(selectedView)
                            ? 'En retard'
                            : 'À faire'}
                    </div>
                    
                    {selectedView.soumis && (
                      <span className="text-sm text-gray-600">
                        Soumis le {formatDate(selectedView.dateSoumission || new Date())}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`http://localhost:5000/${selectedView.filepath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le sujet
                    </a>
                    
                    {!selectedView.soumis ? (
                      <button
                        onClick={() => {
                          setSelectedView(null);
                          setSelectedExercice(selectedView);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Soumettre ma réponse
                      </button>
                    ) : selectedView.filepath_soumission ? (
                      <a
                        href={`http://localhost:5000/${selectedView.filepath_soumission}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger ma soumission
                      </a>
                    ) : null}
                  </div>
                </div>
                
                {/* Note et commentaire */}
                {selectedView.note && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-amber-600" />
                      Évaluation
                    </h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-medium text-gray-800">Note obtenue</div>
                      <div className="text-lg font-bold text-green-700 bg-white px-3 py-1 rounded-lg">
                        {selectedView.note}/20
                      </div>
                    </div>
                    
                    {selectedView.commentaire && (
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Commentaire du professeur</h4>
                        <p className="text-gray-800">{selectedView.commentaire}</p>
                      </div>
                    )}
                    
                    <p className="text-xs text-right text-gray-500 mt-3">
                      {selectedView.dateNotation ? `Noté le ${formatDate(selectedView.dateNotation)}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExercicesEleve;