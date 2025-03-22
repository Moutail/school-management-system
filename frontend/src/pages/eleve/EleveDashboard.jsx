import { useState, useEffect } from 'react';
import { 
  BookOpen, BarChart2,
  Download, Search, AlertCircle, User,
  Calendar, Bell,Award,
  ArrowRight, Sparkles, Clock,
  ScrollText,
  GraduationCap
} from 'lucide-react';
import { getCoursForClasse, getNotesForEleve } from '../../services/api';
import { API_URL } from '../../config/api.config';

function EleveDashboard() {
  const [cours, setCours] = useState([]);
  const [notes, setNotes] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        const classeId = localStorage.getItem('classeId');
    
        if (!userId || !classeId) {
          window.location.href = '/login';
          return;
        }
    
        // Charger les données de l'élève
        const userResponse = await fetch(`${API_URL}/eleves/${userId}`);
        const userData = await userResponse.json();
        setUserInfo(userData);
    
        // Charger les cours
        const coursResponse = await getCoursForClasse(classeId);
        const coursData = coursResponse.cours || [];
        setCours(coursData);
    
        // Charger les notes
        const notesData = await getNotesForEleve(userId);
        setNotes(notesData || []);
    
        // Créer un tableau d'activités récentes
        const activities = [
          ...coursData.map(c => ({
            type: 'cours',
            date: new Date(c.dateUpload),
            data: c
          })),
          ...notesData.map(n => ({
            type: 'note',
            date: new Date(n.date),
            data: n
          }))
        ].sort((a, b) => b.date - a.date).slice(0, 5);
    
        setRecentActivities(activities);
      } catch (error) {
        console.error("Erreur:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateMoyenne = () => {
    if (!notes.length) return 0;
    return (notes.reduce((sum, note) => sum + Number(note.note), 0) / notes.length).toFixed(2);
  };

  const navigateTo = (path) => {
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Un problème est survenu</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Obtenir la date actuelle formatée
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* En-tête avec informations de l'élève - style amélioré */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 pt-8 rounded-b-3xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-100 mb-2 text-sm">{getCurrentDate()}</p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Bienvenue, {userInfo?.nom}
              </h1>
              <p className="text-blue-100 flex items-center">
                <GraduationCap className="w-4 h-4 mr-1.5" /> 
                Classe de {localStorage.getItem('className')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10">
        {/* Statistiques - cartes améliorées avec ombres et gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-sm">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Cours</p>
              <p className="text-2xl font-bold text-gray-800">{cours.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 mb-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-sm">
                <BarChart2 className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Moyenne</p>
              <p className="text-2xl font-bold text-gray-800">{calculateMoyenne()}/20</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 mb-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-sm">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Activités</p>
              <p className="text-2xl font-bold text-gray-800">{recentActivities.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center">
              <div className="p-3 mb-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-sm">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Réussites</p>
              <p className="text-2xl font-bold text-gray-800">
                {notes.filter(n => Number(n.note) >= 15).length}
              </p>
            </div>
          </div>
        </div>

        {/* Activités récentes - redesign avec effets de carte */}
        <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Activités récentes
            </h2>
            <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {recentActivities.length} activités
            </span>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 hover:border-gray-200"
                >
                  <div className={`p-3 rounded-xl ${
                    activity.type === 'cours' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {activity.type === 'cours' ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <BarChart2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {activity.type === 'cours' ? activity.data.titre : `Note: ${activity.data.note}/20`}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {activity.date.toLocaleDateString()}
                      </span>
                      {activity.type === 'note' && activity.data.matiere && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                          {activity.data.matiere.nom}
                        </span>
                      )}
                    </p>
                  </div>
                  {activity.type === 'cours' && (
                    <button
                      onClick={() => window.open(`http://localhost:5000/${activity.data.filepath}`, '_blank')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 font-medium">Aucune activité récente</p>
                <p className="text-sm text-gray-500 mt-1">Revenez plus tard pour voir les mises à jour</p>
              </div>
            )}
          </div>
        </div>

        {/* Derniers cours - interface améliorée */}
        <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Derniers cours
            </h2>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full sm:w-64 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            {cours
              .filter(c => 
                c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .slice(0, 5)
              .map((cours) => (
                <div 
                  key={cours.id}
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all hover:shadow-sm"
                >
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cours.titre}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(cours.dateUpload).toLocaleDateString()}
                      </span>
                      {cours.matiereName && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-700">
                          {cours.matiereName}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`http://localhost:5000/${cours.filepath}`, '_blank')}
                    className="px-3.5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors shadow-sm"
                  >
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </span>
                  </button>
                </div>
              ))}

            {cours.filter(c => c.titre.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 font-medium">Aucun cours trouvé</p>
                <p className="text-sm text-gray-500 mt-1">Essayez un autre terme de recherche</p>
              </div>
            )}

            {cours.length > 5 && (
              <div className="text-center pt-4">
                <button 
                  onClick={() => navigateTo('/eleve/cours')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1.5 mx-auto px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Voir tous les cours
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Section "À ne pas manquer" - nouvelle section */}
        <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
              À ne pas manquer
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prochaines évaluations */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-amber-800">Prochaines évaluations</h3>
              </div>
              
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.slice(0, 2).map((note, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div>
                        <p className="font-medium text-gray-800">{note.matiere?.nom || 'Matière'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">
                        {note.note}/20
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-600">Aucune évaluation prévue</p>
                </div>
              )}
            </div>
            
            {/* Bulletin scolaire */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ScrollText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800">Mon bulletin</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-lg shadow-sm">
                <div className="mb-3 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <p className="text-2xl font-bold text-blue-700">{calculateMoyenne()}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Moyenne générale /20</p>
                <button 
                  onClick={() => navigateTo('/eleve/bulletin')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  <ScrollText className="w-4 h-4 mr-2" />
                  Accéder à mon bulletin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EleveDashboard;
