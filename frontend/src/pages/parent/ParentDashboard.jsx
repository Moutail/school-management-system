// pages/parent/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Book, GraduationCap, 
  FileText, Mail, DollarSign,
  Calendar, Bell, CheckCircle, 
   AlertTriangle, TrendingUp
} from 'lucide-react';

function ParentDashboard() {
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const parentId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/parents/${parentId}/eleves`);
        const data = await response.json();
        setEleves(data);
        
        // Simuler des annonces ou les charger depuis l'API
        setAnnouncements([
          { id: 1, title: "Réunion parents-professeurs", date: "2023-11-15", priority: "normal" },
          { id: 2, title: "Vacances scolaires", date: "2023-12-20", priority: "info" },
          { id: 3, title: "Rappel: Paiement frais scolaires", date: "2023-11-05", priority: "high" }
        ]);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [parentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-700">Chargement des données...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // Formater la date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 mb-6 shadow-md">
          <h1 className="text-2xl font-bold mb-2">Tableau de bord parent</h1>
          <p className="text-blue-100 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Pas d'enfant associé */}
        {eleves.length === 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-xl shadow-sm mb-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-800 mb-1">Aucun élève associé</h3>
              <p className="text-orange-700">
                Aucun enfant n&lsquo;est actuellement associé à votre compte. 
                Veuillez contacter l&apos;administration de l&apos;école.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Liste des enfants */}
            <div className="grid gap-6 md:grid-cols-2">
              {eleves.map(eleve => (
                <div key={eleve.id} className="bg-white rounded-2xl shadow-sm p-6 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-gray-800">{eleve.nom}</h3>
                      <p className="text-gray-500">Classe: {eleve.classe || eleve.classeId}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link 
                      to={`/parent/bulletin?eleveId=${eleve.id}`}
                      className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <TrendingUp className="text-blue-600 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Bulletin scolaire</span>
                        <p className="text-xs text-blue-600">Consulter les résultats</p>
                      </div>
                    </Link>

                    <Link 
                      to={`/parent/eleve/${eleve.id}/notes`}
                      className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <FileText className="text-indigo-600 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Notes et évaluations</span>
                        <p className="text-xs text-indigo-600">Suivre les progrès</p>
                      </div>
                    </Link>

                    <Link 
                      to={`/parent/eleve/${eleve.id}/cours`}
                      className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Book className="text-green-600 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Cours et devoirs</span>
                        <p className="text-xs text-green-600">Matériel pédagogique</p>
                      </div>
                    </Link>

                    <Link 
                      to={`/parent/eleve/${eleve.id}/frais`}
                      className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors"
                    >
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <DollarSign className="text-amber-600 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Frais de scolarité</span>
                        <p className="text-xs text-amber-600">Suivi des paiements</p>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Annonces & Événements */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Annonces et événements
              </h2>
              
              <div className="space-y-3 mt-4">
                {announcements.map(announcement => (
                  <div 
                    key={announcement.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      announcement.priority === 'high' ? 'bg-red-100' : 
                      announcement.priority === 'normal' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {announcement.priority === 'high' ? 
                        <AlertTriangle className="w-5 h-5 text-red-600" /> : 
                        announcement.priority === 'normal' ? 
                        <Bell className="w-5 h-5 text-blue-600" /> : 
                        <Calendar className="w-5 h-5 text-gray-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(announcement.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {announcements.length === 0 && (
                  <div className="text-center py-4 bg-gray-50 rounded-xl">
                    <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">Aucune annonce pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Communication */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Communication
              </h2>
              
              <div className="space-y-3 mt-4">
                <Link 
                  to="/messages"
                  className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Mail className="text-blue-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Messagerie</h3>
                    <p className="text-sm text-gray-500">
                      Communiquer avec l&apos;équipe pédagogique
                    </p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <GraduationCap className="text-purple-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Contact École Nuage</h3>
                    <p className="text-sm text-gray-500">
                      Email: contact@ecole.com
                    </p>
                    <p className="text-sm text-gray-500">
                      Tél: 01 23 45 67 89
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Calendrier */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Calendrier
              </h2>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="text-blue-600 w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Réunion parents-profs</h3>
                    <p className="text-xs text-gray-500">15 novembre 2023</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="text-green-600 w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Début vacances scolaires</h3>
                    <p className="text-xs text-gray-500">20 décembre 2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;