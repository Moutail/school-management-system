import { useState, useEffect } from 'react';
import { 
  Upload, Download, Clock, Edit2, Trash2, Users,
   Filter, Tag, ChevronDown,
  AlertCircle, FileText, Plus, X, CheckCircle, XCircle, BookOpen,
  Check,
  Calendar
} from 'lucide-react';
import { 
  getAllExercices, 
  getProfesseurClasses, 
  getMatieresForProfesseur,
  uploadExercice,
  deleteExercice,
  updateExercice
} from '../../services/api';
import { useNavigate } from 'react-router-dom';

function ExercicesGestion() {
  const navigate = useNavigate();
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [editingExerciceId, setEditingExerciceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [newExercice, setNewExercice] = useState({
    titre: '',
    description: '',
    dateLimit: '',
    file: null
  });

  // Chargement des données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const professeurId = localStorage.getItem('userId');
        
        try {
          const [exercicesData, classesData, matieresResponse] = await Promise.all([
            getAllExercices(),
            getProfesseurClasses(),
            getMatieresForProfesseur(professeurId)
          ]);

          setExercices(exercicesData || []);
          setClasses(classesData || []);
          
          // Traitement des matières
          const matieresPlates = matieresResponse.reduce((acc, groupe) => {
            if (groupe.matieres) {
              return [...acc, ...groupe.matieres];
            }
            return acc;
          }, []);
          setMatieres(matieresPlates);
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
          setError("Une erreur est survenue lors du chargement des données.");
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError("Impossible de charger les exercices.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (exercice) => {
    // Afficher les données de l'exercice dans le formulaire d'édition
    setNewExercice({
      titre: exercice.titre,
      description: exercice.description || '',
      dateLimit: exercice.dateLimit ? new Date(exercice.dateLimit).toISOString().slice(0, 16) : '',
      file: null // Le fichier ne peut pas être pré-rempli
    });
    
    // Définir la classe et la matière sélectionnées
    setSelectedClasse(exercice.classeId);
    setSelectedMatiere(exercice.matiereId);
    
    // Stocker l'ID de l'exercice pour la mise à jour
    setEditingExerciceId(exercice.id);
    
    // Ouvrir le modal d'upload (qui sera utilisé pour l'édition)
    setShowUploadModal(true);
  };

  const handleDelete = (exerciceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      deleteExercice(exerciceId)
        .then(() => {
          // Mettre à jour la liste des exercices après suppression
          setExercices(exercices.filter(e => e.id !== exerciceId));
          alert('Exercice supprimé avec succès');
        })
        .catch(error => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de l\'exercice');
        });
    }
  };

  // Fonction de validation du formulaire
  const validateExerciceForm = () => {
    const errors = [];
    
    if (!newExercice.titre.trim()) {
      errors.push('Le titre est obligatoire');
    }
    
    // Le fichier est requis uniquement pour un nouvel exercice
    if (!editingExerciceId && !newExercice.file) {
      errors.push('Un fichier est requis pour un nouvel exercice');
    }
    
    if (!selectedClasse) {
      errors.push('Vous devez sélectionner une classe');
    }
    
    if (!selectedMatiere) {
      errors.push('Vous devez sélectionner une matière');
    }
    
    if (newExercice.dateLimit) {
      const date = new Date(newExercice.dateLimit);
      if (isNaN(date.getTime())) {
        errors.push('Le format de la date limite est invalide');
      }
    }
    
    return errors;
  };

  const handleSubmitExercice = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire
    const validationErrors = validateExerciceForm();
    if (validationErrors.length > 0) {
      alert(`Formulaire invalide:\n${validationErrors.join('\n')}`);
      return;
    }
    
    const formData = new FormData();
    formData.append('titre', newExercice.titre);
    formData.append('description', newExercice.description);
    
    // Vérifier et formater la date si elle existe
    if (newExercice.dateLimit) {
      try {
        // Assurez-vous que c'est une date valide
        const dateObj = new Date(newExercice.dateLimit);
        if (!isNaN(dateObj.getTime())) {
          formData.append('dateLimit', dateObj.toISOString());
        } else {
          console.warn('Date invalide ignorée:', newExercice.dateLimit);
        }
      } catch (err) {
        console.error('Erreur lors du formatage de la date:', err);
        // Ne pas ajouter la date au formData si elle est invalide
      }
    }
    
    formData.append('classeId', selectedClasse);
    formData.append('matiereId', selectedMatiere);
    formData.append('professeurId', localStorage.getItem('userId'));
    
    // Seulement ajouter le fichier s'il existe
    if (newExercice.file) {
      formData.append('file', newExercice.file);
    }
  
    try {
      // Mode édition
      if (editingExerciceId) {
        // Si aucun fichier n'a été sélectionné en mode édition, utiliser updateExercice
        if (!newExercice.file) {
          const updateData = {
            titre: newExercice.titre,
            description: newExercice.description,
            dateLimit: newExercice.dateLimit ? new Date(newExercice.dateLimit).toISOString() : null
          };
          
          console.log('Mise à jour de l\'exercice avec les données:', updateData);
          
          const updatedExercice = await updateExercice(editingExerciceId, updateData);
          
          // Mise à jour de l'exercice dans la liste
          setExercices(exercices.map(e => 
            e.id === editingExerciceId ? updatedExercice : e
          ));
          
          alert('Exercice mis à jour avec succès');
        } else {
          // Si un fichier a été sélectionné, informer l'utilisateur
          alert("La mise à jour du fichier n'est pas encore implémentée. Veuillez supprimer et recréer l'exercice.");
          return;
        }
      } else {
        // Vérifier que le fichier est présent pour un nouvel exercice
        if (!newExercice.file) {
          alert('Veuillez sélectionner un fichier pour le nouvel exercice');
          return;
        }
        
        // Créer un nouvel exercice
        console.log('Création d\'un nouvel exercice avec les données:', {
          titre: newExercice.titre,
          description: newExercice.description,
          classeId: selectedClasse,
          matiereId: selectedMatiere
        });
        
        const exercice = await uploadExercice(formData);
        setExercices([...exercices, exercice]);
        
        alert('Exercice créé avec succès');
      }
      
      // Réinitialiser le formulaire et fermer le modal
      setShowUploadModal(false);
      setNewExercice({
        titre: '',
        description: '',
        dateLimit: '',
        file: null
      });
      setEditingExerciceId(null);
      setSelectedClasse('');
      setSelectedMatiere('');
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'opération: ' + (error.message || 'Erreur inconnue'));
    }
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  };

  // Vérifier si un exercice est en retard
  const isLate = (exercice) => {
    if (!exercice.dateLimit) return false;
    const now = new Date();
    const limitDate = new Date(exercice.dateLimit);
    return now > limitDate;
  };

  // Calculer le temps restant avant la date limite
  const getTimeRemaining = (dateLimit) => {
    if (!dateLimit) return '';
    
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

  // Obtenir le status d'un exercice (pour filtrage)
  const getExerciceStatus = (exercice) => {
    if (exercice.note) return 'note';
    if (exercice.soumissions && exercice.soumissions.length > 0) return 'soumis';
    if (isLate(exercice)) return 'retard';
    return 'encours';
  };

  // Filtrer les exercices
  const filteredExercices = exercices.filter(ex => {
    const matchesSearch = ex.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || getExerciceStatus(ex) === statusFilter;
    const matchesClasse = !selectedClasse || ex.classeId === selectedClasse;
    const matchesMatiere = !selectedMatiere || ex.matiereId === selectedMatiere;
    
    return matchesSearch && matchesStatus && matchesClasse && matchesMatiere;
  });

  // Trier les exercices
  const sortedExercices = [...filteredExercices].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.dateCreation || b.dateUpload) - new Date(a.dateCreation || a.dateUpload);
    } else if (sortOrder === 'dateLimit') {
      // Si pas de date limite, mettre à la fin
      if (!a.dateLimit) return 1;
      if (!b.dateLimit) return -1;
      return new Date(a.dateLimit) - new Date(b.dateLimit);
    }
    // Par défaut, trier par titre
    return a.titre.localeCompare(b.titre);
  });

  // Obtenir la classe et le nom de la matière
  const getClasseName = (classeId) => {
    const classe = classes.find(c => c.id === classeId);
    return classe ? classe.nom : 'Classe inconnue';
  };

  const getMatiereName = (matiereId) => {
    const matiere = matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : 'Matière inconnue';
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (exercice) => {
    const status = getExerciceStatus(exercice);
    switch (status) {
      case 'note':
        return 'bg-green-100 text-green-800';
      case 'soumis':
        return 'bg-blue-100 text-blue-800';
      case 'retard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getStatusIcon = (exercice) => {
    const status = getExerciceStatus(exercice);
    switch (status) {
      case 'note':
        return <CheckCircle className="w-4 h-4" />;
      case 'soumis':
        return <Check className="w-4 h-4" />;
      case 'retard':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (exercice) => {
    const status = getExerciceStatus(exercice);
    switch (status) {
      case 'note':
        return 'Noté';
      case 'soumis':
        return 'Soumis';
      case 'retard':
        return 'En retard';
      default:
        return 'En cours';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-blue-600 font-medium">Chargement des exercices...</p>
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
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Exercices</h1>
          <p className="text-gray-500 mt-1">Créez et suivez les exercices pour vos élèves</p>
        </div>
        <button
          onClick={() => {
            setEditingExerciceId(null);
            setNewExercice({
              titre: '',
              description: '',
              dateLimit: '',
              file: null
            });
            setShowUploadModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvel Exercice
        </button>
      </div>

      {/* Filtres et options */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Recherche */}
          <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Plus récents d&apos;abord</option>
            <option value="oldest">Plus anciens d&lsquo;abord</option>
            <option value="dateLimit">Par date limite</option>
            <option value="title">Ordre alphabétique</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
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

          {/* Filtre par statut */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="encours">En cours</option>
              <option value="soumis">Soumis</option>
              <option value="note">Notés</option>
              <option value="retard">En retard</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{exercices.length}</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-medium">En cours</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">
              {exercices.filter(ex => getExerciceStatus(ex) === 'encours').length}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Notés</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {exercices.filter(ex => getExerciceStatus(ex) === 'note').length}
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">En retard</span>
            </div>
            <p className="text-2xl font-bold text-red-800">
              {exercices.filter(ex => getExerciceStatus(ex) === 'retard').length}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des exercices */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedExercices.length > 0 ? (
          sortedExercices.map(exercice => (
            <div key={exercice.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
              {/* Barre de statut en haut */}
              <div className={`h-2 ${
                getExerciceStatus(exercice) === 'note' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                getExerciceStatus(exercice) === 'soumis' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                getExerciceStatus(exercice) === 'retard' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                'bg-gradient-to-r from-amber-400 to-amber-500'
              }`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{exercice.titre}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-sm text-gray-600 flex items-center">
                        <BookOpen className="w-4 h-4 mr-1 text-gray-500" />
                        {getClasseName(exercice.classeId)}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getMatiereName(exercice.matiereId)}
                      </span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(exercice)}`}>
                    {getStatusIcon(exercice)}
                    <span>{getStatusText(exercice)}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{exercice.description || "Aucune description fournie."}</p>

                {exercice.dateLimit && (
                  <div className="flex items-center gap-2 text-gray-700 mb-4 bg-gray-50 p-3 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Date limite: {formatDate(exercice.dateLimit)}
                      </p>
                      {getExerciceStatus(exercice) !== 'note' && getExerciceStatus(exercice) !== 'soumis' && (
                        <p className={`text-xs ${isLate(exercice) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {getTimeRemaining(exercice.dateLimit)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3 justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`http://localhost:5000/${exercice.filepath}`, '_blank')}
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </button>

                    <button
                      onClick={() => navigate(`/professeur/exercices/soumissions/${exercice.id}`)}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      <Users className="w-4 h-4" />
                      <span>
                        {exercice.soumissions?.length || 0} soumission(s)
                      </span>
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(exercice)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(exercice.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun exercice disponible</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {searchTerm || selectedClasse || selectedMatiere || statusFilter !== 'all'
                ? "Aucun exercice ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore créé d'exercices. Cliquez sur \"Nouvel Exercice\" pour en créer un."}
            </p>
            {(searchTerm || selectedClasse || selectedMatiere || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClasse('');
                  setSelectedMatiere('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExerciceId ? 'Modifier l\'exercice' : 'Nouvel Exercice'}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitExercice} className="p-6">
              <div className="space-y-5">
                {/* Sélection de la classe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classe *</label>
                  <div className="relative">
                    <select
                      value={selectedClasse}
                      onChange={(e) => setSelectedClasse(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>{classe.nom}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {/* Sélection de la matière */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Matière *</label>
                  <div className="relative">
                    <select
                      value={selectedMatiere}
                      onChange={(e) => setSelectedMatiere(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner une matière</option>
                      {matieres.map(matiere => (
                        <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={newExercice.titre}
                    onChange={(e) => setNewExercice({...newExercice, titre: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Titre de l'exercice"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newExercice.description}
                    onChange={(e) => setNewExercice({...newExercice, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Description détaillée de l'exercice (optionnelle)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite
                  </label>
                  <input
                    type="datetime-local"
                    value={newExercice.dateLimit}
                    onChange={(e) => setNewExercice({...newExercice, dateLimit: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide si aucune date limite n&apos;est prévue
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier {!editingExerciceId ? "*" : ""}
                    {editingExerciceId && "(La mise à jour du fichier n'est pas encore prise en charge)"}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => setNewExercice({...newExercice, file: e.target.files[0]})}
                      className="hidden"
                      id="file-upload"
                      required={!editingExerciceId}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {newExercice.file ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-100 p-3 rounded-full mb-2">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-blue-700 font-medium">{newExercice.file.name}</p>
                          <p className="text-gray-500 text-sm mt-1">{(newExercice.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="bg-gray-100 p-3 rounded-full mb-3">
                            <Upload className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-gray-700 font-medium">Cliquez pour choisir un fichier</p>
                          <p className="text-gray-500 text-sm mt-1">ou glissez-déposez ici</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm transition-colors"
                >
                  {editingExerciceId ? 'Mettre à jour' : 'Créer l\'exercice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExercicesGestion;