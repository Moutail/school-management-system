import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  BookOpen, Users, FileText, GraduationCap, Book,
  Activity, Search, Calendar, 
  CheckCircle,
  Mail, Info, ChevronRight, Plus,
  ListChecks, 
  Download,
  AlertCircle,
  X
} from 'lucide-react';

import { 
  getProfesseurClasses, 
  getMatieresForProfesseur,
  getElevesForClasse,
  getCoursForClasse
} from '../../services/api';
import ExerciceForm from '../../components/ExerciceForm';

// Import des composants personnalisés
import NoteForm from '../../components/NoteForm';
import CoursUpload from '../../components/CoursUpload';
import MatiereForm from '../../components/MatiereForm';

function ProfesseurDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEleves: 0,
    totalMatieres: 0,
    coursEnLigne: 0,
    exercices: 0,
    messages: 0
  });
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoadingSection, setIsLoadingSection] = useState(false);
  
  // États pour les composants intégrés
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [showAddMatiereForm, setShowAddMatiereForm] = useState(false);
  const [showAddCoursForm, setShowAddCoursForm] = useState(false);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [showAddExerciceForm, setShowAddExerciceForm] = useState(false);


  useEffect(() => {
    const professeurId = localStorage.getItem('userId');
    if (!professeurId) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger les classes
        const classesData = await getProfesseurClasses();
        setClasses(classesData || []);
        
        if (classesData && classesData.length > 0) {
          setSelectedClasse(classesData[0].id);
        }
    
        // Charger les matières
        const matieresResponse = await getMatieresForProfesseur(professeurId);
        setMatieres(matieresResponse || []);
        
        // Charger les statistiques globales
        let totalEleves = 0;
        let totalCours = 0;
        let totalMatieres = 0;
        
        // Compter les élèves de toutes les classes
        const elevePromises = classesData.map(classe => 
          getElevesForClasse(classe.id)
            .then(eleves => {
              if (Array.isArray(eleves)) {
                totalEleves += eleves.length;
              }
              return eleves;
            })
            .catch(err => {
              console.error('Erreur de chargement des élèves:', err);
              return [];
            })
        );
        
        await Promise.all(elevePromises);
        
        // Compter les matières
        matieresResponse.forEach(group => {
          if (group.matieres) {
            totalMatieres += group.matieres.length;
            group.matieres.forEach(matiere => {
              if (matiere.nombreCours) {
                totalCours += matiere.nombreCours;
              }
            });
          }
        });
        
        // Simuler d'autres statistiques (pour le moment)
        const exercicesCount = Math.floor(Math.random() * 10) + 5;
        const messagesCount = Math.floor(Math.random() * 15) + 2;
        
        setStats({
          totalClasses: classesData?.length || 0,
          totalEleves,
          totalMatieres,
          coursEnLigne: totalCours,
          exercices: exercicesCount,
          messages: messagesCount
        });
        
        // Créer des activités récentes simulées
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const activities = [
          {
            type: 'cours',
            titre: 'Nouveau cours mis en ligne',
            description: 'Vous avez partagé un nouveau support de cours',
            date: today,
            matiere: matieresResponse[0]?.matieres?.[0]?.nom || 'Mathématiques',
            icone: <FileText />
          },
          {
            type: 'note',
            titre: 'Notes enregistrées',
            description: '12 élèves ont été notés sur un exercice',
            date: yesterday,
            matiere: matieresResponse[0]?.matieres?.[1]?.nom || 'Français',
            icone: <CheckCircle />
          },
          {
            type: 'eleve',
            titre: 'Nouveau message reçu',
            description: 'Un élève vous a envoyé un message',
            date: yesterday,
            matiere: '',
            icone: <Mail />
          },
          {
            type: 'exercice',
            titre: 'Nouvel exercice créé',
            description: 'Vous avez créé un exercice avec date limite',
            date: twoDaysAgo,
            matiere: matieresResponse[0]?.matieres?.[0]?.nom || 'Mathématiques',
            icone: <BookOpen />
          }
        ];
        
        setRecentActivity(activities);
        
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setError("Une erreur est survenue lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Charger les élèves d'une classe spécifique
  useEffect(() => {
    if (!selectedClasse) return;
    
    const fetchClasseData = async () => {
      try {
        setIsLoadingSection(true);
        
        // Charger les élèves
        const elevesData = await getElevesForClasse(selectedClasse);
        setEleves(elevesData || []);
        
        // Charger les cours
        const coursResponse = await getCoursForClasse(selectedClasse);
        const coursData = Array.isArray(coursResponse) ? coursResponse : 
                          coursResponse?.cours || [];
        setCours(coursData);
        
      } catch (error) {
        console.error('Erreur chargement données de classe:', error);
      } finally {
        setIsLoadingSection(false);
      }
    };
    
    fetchClasseData();
  }, [selectedClasse]);

  const handleMatiereChange = (matiereId) => {
    setSelectedMatiere(matiereId);
  };

  const handleMatieresUpdate = async () => {
    const professeurId = localStorage.getItem('userId');
    const matieresResponse = await getMatieresForProfesseur(professeurId);
    setMatieres(matieresResponse || []);
    
    // Mettre à jour les statistiques
    setStats(prev => ({
      ...prev,
      totalMatieres: matieresResponse.reduce((total, group) => total + (group.matieres?.length || 0), 0)
    }));
    
    // Fermer le formulaire après mise à jour
    setShowAddMatiereForm(false);
  };

  const handleCoursUploadSuccess = async () => {
    // Recharger les cours pour la classe sélectionnée
    const coursResponse = await getCoursForClasse(selectedClasse);
    const coursData = Array.isArray(coursResponse) ? coursResponse : 
                      coursResponse?.cours || [];
    setCours(coursData);
    
    // Mettre à jour le compteur de cours
    setStats(prev => ({
      ...prev,
      coursEnLigne: prev.coursEnLigne + 1
    }));
    
    // Fermer le formulaire après upload
    setShowAddCoursForm(false);
  };

  const getMatieresForClasse = (classeId) => {
    const classeGroup = matieres.find(group => group.classeId === classeId);
    return classeGroup?.matieres || [];
  };

  const formatDate = (date) => {
    const today = new Date();
    const activityDate = new Date(date);
    
    // Si c'est aujourd'hui
    if (activityDate.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${activityDate.getHours()}:${activityDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Si c'est hier
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (activityDate.toDateString() === yesterday.toDateString()) {
      return `Hier à ${activityDate.getHours()}:${activityDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Sinon, date complète
    return activityDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getClasseById = (classeId) => {
    return classes.find(c => c.id === classeId) || null;
  };
  
  const getMatiereById = (matiereId) => {
    for (const group of matieres) {
      if (group.matieres) {
        const matiere = group.matieres.find(m => m.id === matiereId);
        if (matiere) return matiere;
      }
    }
    return null;
  };

  // Filtrer les élèves par terme de recherche
  const filteredEleves = eleves.filter(eleve => 
    eleve.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Organiser les élèves par ordre alphabétique
  const sortedEleves = [...filteredEleves].sort((a, b) => 
    a.nom.localeCompare(b.nom)
  );

  // Trier les cours par date (du plus récent au plus ancien)
  const sortedCours = [...cours].sort((a, b) => 
    new Date(b.dateUpload) - new Date(a.dateUpload)
  );

  // Fonction pour basculer les formulaires
  const toggleSection = (section) => {
    // Fermer tous les formulaires
    setShowAddMatiereForm(false);
    setShowAddCoursForm(false);
    setShowAddNoteForm(false);
    
    if (section === 'exercice') {
      setShowAddExerciceForm(true);
    }
    // Ouvrir le formulaire demandé
    if (section === 'matiere') {
      setShowAddMatiereForm(true);
    } else if (section === 'cours') {
      setShowAddCoursForm(true);
    } else if (section === 'note') {
      setShowAddNoteForm(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-blue-600 font-medium">Chargement du tableau de bord...</p>
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
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* En-tête avec informations du professeur */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 pt-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-100 mb-1 text-sm">Tableau de bord professeur</p>
          <h1 className="text-2xl font-bold mb-2">
            Bienvenue, {localStorage.getItem('userName') || 'Professeur'}
          </h1>
          <p className="text-blue-100 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5" /> 
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-5 transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-blue-100 rounded-xl mb-3">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stats.totalClasses}</p>
              <p className="text-gray-500 text-sm mt-1">Classes</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-5 transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-green-100 rounded-xl mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stats.totalEleves}</p>
              <p className="text-gray-500 text-sm mt-1">Élèves</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-5 transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-purple-100 rounded-xl mb-3">
                <Book className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stats.totalMatieres}</p>
              <p className="text-gray-500 text-sm mt-1">Matières</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-5 transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-amber-100 rounded-xl mb-3">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stats.coursEnLigne}</p>
              <p className="text-gray-500 text-sm mt-1">Cours</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-5 transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-indigo-100 rounded-xl mb-3">
                <ListChecks className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stats.exercices}</p>
              <p className="text-gray-500 text-sm mt-1">Exercices</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-5 transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-pink-100 rounded-xl mb-3">
                <Mail className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stats.messages}</p>
              <p className="text-gray-500 text-sm mt-1">Messages</p>
            </div>
          </div>
        </div>
        
        {/* Navigation des onglets */}
        <div className="bg-white rounded-2xl shadow-md mb-8">
          <div className="flex flex-wrap p-4 gap-2 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Vue d&lsquo;ensemble
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'classes' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mes Classes
            </button>
            <button
              onClick={() => setActiveTab('eleves')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'eleves' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Élèves
            </button>
            <button
              onClick={() => setActiveTab('cours')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'cours' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cours
            </button>
            <button
              onClick={() => setActiveTab('exercices')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'exercices' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Exercices
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'notes' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Notes
            </button>
          </div>
        </div>
        
        {/* Section principale basée sur l'onglet actif */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche (classes) */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
              Mes classes
            </h2>
            
            <div className="space-y-3">
              {classes.length > 0 ? (
                classes.map((classe) => (
                  <button
                    key={classe.id}
                    onClick={() => setSelectedClasse(classe.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                      selectedClasse === classe.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200'
                    } border hover:border-blue-200`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3 text-left">
                        <h3 className="font-medium text-gray-900">{classe.nom}</h3>
                        <p className="text-xs text-gray-500">
                          {getMatieresForClasse(classe.id).length} matière(s)
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                    <GraduationCap className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucune classe assignée</p>
                  <p className="text-xs text-gray-400 mt-1">Contactez l&apos;administration</p>
                </div>
              )}
            </div>
            
            {classes.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => navigate('/professeur/classes')}
                  className="w-full text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 font-medium"
                >
                  <span>Gérer mes classes</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Boutons d'actions rapides */}
            {selectedClasse && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Actions rapides</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleSection('cours')}
                    className="p-3 bg-blue-50 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un cours
                  </button>
                  <button
                    onClick={() => toggleSection('matiere')}
                    className="p-3 bg-purple-50 rounded-xl text-purple-600 text-sm font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une matière
                  </button>
                  <button
                    onClick={() => toggleSection('note')}
                    className="p-3 bg-green-50 rounded-xl text-green-600 text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1 col-span-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter des notes
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Colonne centrale (contenu principal) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Activité récente
                </h2>
                
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                          activity.type === 'cours' ? 'bg-blue-100 text-blue-600' : 
                          activity.type === 'note' ? 'bg-green-100 text-green-600' : 
                          activity.type === 'eleve' ? 'bg-amber-100 text-amber-600' : 
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          {activity.icone || <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{activity.titre}</h3>
                              <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(activity.date)}</span>
                          </div>
                          {activity.matiere && (
                            <div className="mt-2">
                              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {activity.matiere}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Aucune activité récente</p>
                    <p className="text-xs text-gray-400 mt-1">Vos activités apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Section de formulaire dynamique basée sur la sélection */}
            {selectedClasse && showAddMatiereForm && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Book className="w-5 h-5 mr-2 text-purple-600" />
                    Ajouter une nouvelle matière
                  </h2>
                  <button
                    onClick={() => setShowAddMatiereForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <MatiereForm 
                  classeId={selectedClasse} 
                  onMatiereCreated={handleMatieresUpdate} 
                />
              </div>
            )}

            {selectedClasse && showAddCoursForm && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Ajouter un nouveau cours
                  </h2>
                  <button
                    onClick={() => setShowAddCoursForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <CoursUpload 
                  classeId={selectedClasse} 
                  matieres={getMatieresForClasse(selectedClasse)}
                  selectedMatiere={selectedMatiere}
                  onMatiereChange={handleMatiereChange}
                  onSuccess={handleCoursUploadSuccess}
                  onClose={() => setShowAddCoursForm(false)}
                  onMatieresUpdate={handleMatieresUpdate}
                />
              </div>
            )}

            {selectedClasse && showAddNoteForm && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Ajouter des notes
                  </h2>
                  <button
                    onClick={() => setShowAddNoteForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <NoteForm
                  classeId={selectedClasse}
                  eleves={eleves}
                  matieres={matieres}
                  selectedMatiere={selectedMatiere}
                  onMatiereChange={handleMatiereChange}
                />
              </div>
            )}
            
            {activeTab === 'classes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                    Mes classes
                  </h2>
                  <button
                    onClick={() => navigate('/professeur/classes')}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <span>Voir tout</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {classes.length > 0 ? (
                    classes.map((classe) => {
                      const classeMatieresCount = getMatieresForClasse(classe.id).length;
                      return (
                        <div 
                          key={classe.id}
                          className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                              </div>
                              <h3 className="font-semibold text-gray-900">{classe.nom}</h3>
                            </div>
                            <div className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                              {classe.niveau || 'Niveau N/A'}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg text-center">
                              <p className="text-sm text-gray-500">Matières</p>
                              <p className="text-xl font-bold text-gray-900">{classeMatieresCount}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg text-center">
                              <p className="text-sm text-gray-500">Élèves</p>
                              <p className="text-xl font-bold text-gray-900">
                                {classe.id === selectedClasse ? eleves.length : '...'}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => navigate(`/professeur/classes/${classe.id}`)}
                            className="w-full mt-2 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 font-medium"
                          >
                            <span>Gérer la classe</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl">
                      <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                        <GraduationCap className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Aucune classe assignée</p>
                      <p className="text-sm text-gray-400 mt-1">Contactez l&apos;administration pour recevoir vos affectations</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'eleves' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Élèves
                    {selectedClasse && getClasseById(selectedClasse) && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        - {getClasseById(selectedClasse).nom}
                      </span>
                    )}
                  </h2>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher un élève..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {isLoadingSection ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {selectedClasse ? (
                      <div>
                        {sortedEleves.length > 0 ? (
                          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            {sortedEleves.map((eleve) => (
                              <div 
                                key={eleve.id}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                              >
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-700 font-medium">
                                    {eleve.nom.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-gray-900 truncate">{eleve.nom}</h3>
                                  <p className="text-sm text-gray-500 truncate">{eleve.email || 'Email non disponible'}</p>
                                </div>
                                <button
                                  onClick={() => navigate(`/professeur/eleves/${eleve.id}`)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-xl">
                            <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                              <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Aucun élève trouvé</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {searchTerm ? "Aucun élève ne correspond à votre recherche" : "Cette classe ne contient pas encore d'élèves"}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-xl">
                        <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                          <GraduationCap className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Sélectionnez une classe</p>
                        <p className="text-sm text-gray-400 mt-1">Choisissez une classe dans la liste pour voir ses élèves</p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/professeur/eleves')}
                    className="w-full text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>Gérer tous les élèves</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'cours' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Mes cours
                  </h2>
                  <button
                    onClick={() => toggleSection('cours')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau cours
                  </button>
                </div>
                
                {isLoadingSection ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {selectedClasse ? (
                      <div>
                        {sortedCours.length > 0 ? (
                          <div className="space-y-4">
                            {sortedCours.slice(0, 5).map((cours) => (
                              <div 
                                key={cours.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                              >
                                <div className="p-3 bg-blue-100 rounded-xl">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-gray-900 truncate">{cours.titre}</h3>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-500">
                                      {new Date(cours.dateUpload).toLocaleDateString()}
                                    </span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                      {getMatiereById(cours.matiereId)?.nom || 'Matière inconnue'}
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={`http://localhost:5000/${cours.filepath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Télécharger</span>
                                </a>
                              </div>
                            ))}
                            
                            {sortedCours.length > 5 && (
                              <div className="text-center mt-4">
                                <button
                                  onClick={() => navigate('/professeur/cours')}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  Voir tous les cours ({sortedCours.length})
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-xl">
                            <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Aucun cours disponible</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Vous n&lsquo;avez pas encore ajouté de cours pour cette classe
                            </p>
                            <button
                              onClick={() => toggleSection('cours')}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                            >
                              Ajouter un cours
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-xl">
                        <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                          <GraduationCap className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Sélectionnez une classe</p>
                        <p className="text-sm text-gray-400 mt-1">Choisissez une classe dans la liste pour voir ses cours</p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/professeur/cours')}
                    className="w-full text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 font-medium"
                  >
                    <span>Gérer tous les cours</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'exercices' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Exercices
                </h2>
                <button
                  onClick={() => toggleSection('exercice')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nouvel exercice
                </button>
              </div>
              
              {selectedClasse && showAddExerciceForm && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                      Ajouter un exercice
                    </h2>
                    <button
                      onClick={() => setShowAddExerciceForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <ExerciceForm 
                    classeId={selectedClasse} 
                    matieres={getMatieresForClasse(selectedClasse)}
                    selectedMatiere={selectedMatiere}
                    onMatiereChange={handleMatiereChange}
                    onSuccess={() => {
                      setShowAddExerciceForm(false);
                      // Mettre à jour les statistiques ou autres données
                      setStats(prev => ({
                        ...prev,
                        exercices: prev.exercices + 1
                      }));
                    }}
                    onClose={() => setShowAddExerciceForm(false)}
                  />
                </div>
              )}
              
              {!showAddExerciceForm && (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Gérer vos exercices</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">
                    Créez et suivez les exercices pour vos élèves
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => toggleSection('exercice')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-1 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un exercice
                    </button>
                    <button
                      onClick={() => navigate('/professeur/exercices')}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm flex items-center justify-center gap-1 mx-auto"
                    >
                      Voir tous les exercices
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

            {activeTab === 'notes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Notes
                  </h2>
                  <button
                    onClick={() => toggleSection('note')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter des notes
                  </button>
                </div>
                
                {selectedClasse ? (
                  <div>
                    {!showAddNoteForm && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleSection('note')}
                          className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 font-medium"
                        >
                          <Plus className="w-5 h-5" />
                          Cliquez ici pour ajouter des notes
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                      <GraduationCap className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Sélectionnez une classe</p>
                    <p className="text-sm text-gray-400 mt-1">Choisissez une classe dans la liste pour gérer les notes</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ProfesseurDashboard.propTypes = {
  onClose: PropTypes.func
};

export default ProfesseurDashboard;
