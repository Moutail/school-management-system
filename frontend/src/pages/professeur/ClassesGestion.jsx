import { useState, useEffect } from 'react';
import { 
  Users, Book, FileText, GraduationCap, 
  CheckCircle, ArrowRight, Shield,
  Calendar
} from 'lucide-react';
import { 
  getProfesseurClasses, 
  assignerClasse, 
  getElevesForClasse,
  getMatieresForProfesseur,
  getCoursForClasse 
} from '../../services/api';

function ClassesGestion() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [classesStats, setClassesStats] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);

  // Charger les classes et leurs statistiques
  useEffect(() => {
    const fetchClassesData = async () => {
      try {
        setLoading(true);
        const professeurId = localStorage.getItem('userId');
        const classesData = await getProfesseurClasses();

        // Charger les statistiques pour chaque classe
        const statsPromises = classesData.map(async (classe) => {
          try {
            // Charger les élèves
            const eleves = await getElevesForClasse(classe.id);
            
            // Charger les matières
            const matieresResponse = await getMatieresForProfesseur(professeurId);
            const matieresClasse = matieresResponse
              .find(g => g.classeId === classe.id)?.matieres || [];
            
            // Charger les cours - traiter correctement la réponse
            const coursResponse = await getCoursForClasse(classe.id);
            const coursData = coursResponse.cours || coursResponse;
            
            return {
              classeId: classe.id,
              stats: {
                nombreEleves: Array.isArray(eleves) ? eleves.length : 0,
                nombreMatieres: matieresClasse.length,
                nombreCours: Array.isArray(coursData) ? coursData.length : 0
              }
            };
          } catch (error) {
            console.error(`Erreur lors du chargement des stats pour la classe ${classe.id}:`, error);
            return {
              classeId: classe.id,
              stats: { nombreEleves: 0, nombreMatieres: 0, nombreCours: 0 }
            };
          }
        });

        const allStats = await Promise.all(statsPromises);
        const statsMap = allStats.reduce((acc, stat) => {
          acc[stat.classeId] = stat.stats;
          return acc;
        }, {});

        setClasses(classesData);
        setClassesStats(statsMap);
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassesData();
  }, []);

  const handleAssign = async (classeId) => {
    try {
      const professeurId = localStorage.getItem('userId');
      const result = await assignerClasse(professeurId, classeId);
      if (result.success) {
        setSelectedClasse(classeId);
        // Recharger les statistiques pour cette classe
        const stats = await fetchClasseStats(classeId);
        setClassesStats(prev => ({
          ...prev,
          [classeId]: stats
        }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    }
  };

  const fetchClasseStats = async (classeId) => {
    try {
      const professeurId = localStorage.getItem('userId');
      const [eleves, matieresResponse, coursResponse] = await Promise.all([
        getElevesForClasse(classeId),
        getMatieresForProfesseur(professeurId),
        getCoursForClasse(classeId)
      ]);
  
      const matieresClasse = matieresResponse
        .find(g => g.classeId === classeId)?.matieres || [];
  
      // Extraire les cours correctement - coursResponse peut être un objet avec une propriété 'cours'
      const coursData = coursResponse.cours || coursResponse;
      
      return {
        nombreEleves: Array.isArray(eleves) ? eleves.length : 0,
        nombreMatieres: matieresClasse.length,
        nombreCours: Array.isArray(coursData) ? coursData.length : 0
      };
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      return { nombreEleves: 0, nombreMatieres: 0, nombreCours: 0 };
    }
  };

  // Obtenir une couleur basée sur l'index de la classe
  const getClassColor = (index) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-teal-500 to-teal-600',
      'from-amber-500 to-amber-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-emerald-500 to-emerald-600',
      'from-orange-500 to-orange-600'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-blue-600 font-medium">Chargement des classes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Classes</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos classes et consultez leurs statistiques
          </p>
        </div>
        <div className="bg-blue-50 text-blue-800 rounded-lg px-4 py-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-medium">
            {classes.length} classe{classes.length > 1 ? 's' : ''} disponible{classes.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classe, index) => (
          <div
            key={classe.id}
            className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${
              selectedClasse === classe.id 
                ? 'ring-2 ring-blue-400 transform scale-[1.02]' 
                : 'hover:shadow-lg hover:transform hover:scale-[1.01]'
            }`}
            onMouseEnter={() => setHoveredCard(classe.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Bannière avec dégradé */}
            <div className={`h-3 bg-gradient-to-r ${getClassColor(index)}`}></div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getClassColor(index)} flex items-center justify-center shadow-sm`}>
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{classe.nom}</h2>
                    <p className="text-gray-500 text-sm">Niveau {classe.niveau}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(classe.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedClasse === classe.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  {selectedClasse === classe.id ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Assignée</span>
                    </div>
                  ) : (
                    <span>Assigner</span>
                  )}
                </button>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xl font-bold text-blue-700">
                      {classesStats[classe.id]?.nombreEleves || 0}
                    </span>
                    <span className="text-xs text-blue-600">Élèves</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl text-center">
                  <div className="flex flex-col items-center">
                    <Book className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-xl font-bold text-purple-700">
                      {classesStats[classe.id]?.nombreMatieres || 0}
                    </span>
                    <span className="text-xs text-purple-600">Matières</span>
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl text-center">
                  <div className="flex flex-col items-center">
                    <FileText className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-xl font-bold text-amber-700">
                      {classesStats[classe.id]?.nombreCours || 0}
                    </span>
                    <span className="text-xs text-amber-600">Cours</span>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Année: {classe.anneeScolaire}</span>
                  </div>
                  {(hoveredCard === classe.id || selectedClasse === classe.id) && (
                    <button className="text-blue-600 flex items-center hover:text-blue-800 transition-colors">
                      <span className="font-medium">Détails</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="bg-gray-100 w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune classe disponible</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Vous n&apos;avez pas encore de classes assignées. Contactez l&apos;administration pour recevoir vos affectations.
          </p>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Contacter l&apos;administration
          </button>
        </div>
      )}
    </div>
  );
}

export default ClassesGestion;