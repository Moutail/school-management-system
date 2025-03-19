import { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Award, 
  Calendar, 
  User,
  AlertCircle,
  ChevronRight,
  Printer,
  BookOpen,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle
} from 'lucide-react';
import { getNotesForEleve } from '../../services/api';

function BulletinEleve() {
  const [bulletinData, setBulletinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriode, setSelectedPeriode] = useState('semestre1');
  const [expandedMatiere, setExpandedMatiere] = useState(null);

  // Fonction pour normaliser les données de notes
  const normalizeNotes = (notes) => {
    return notes.map(note => {
      // Vérifier si la note est valide, sinon essayer d'utiliser valeur
      let noteValue = parseFloat(note.note);
      
      // Si note n'est pas un nombre valide, essayer avec valeur
      if (isNaN(noteValue) && note.valeur !== undefined) {
        noteValue = parseFloat(note.valeur);
      }
      
      return {
        ...note,
        // Remplacer la note par la version normalisée
        note: noteValue
      };
    }).filter(note => !isNaN(note.note)); // Filtrer les notes non numériques
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Récupérer l'année scolaire actuelle
  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Si on est entre septembre et décembre, l'année scolaire est année-année+1
    // Sinon c'est année-1-année
    if (month >= 8) { // Septembre à décembre
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  useEffect(() => {
    const fetchBulletinData = async () => {
      try {
        setLoading(true);
        const eleveId = localStorage.getItem('userId');
        
        if (!eleveId) {
          throw new Error('Identifiant élève non trouvé');
        }

        // Charger les informations de l'élève
        const eleveResponse = await fetch(`http://localhost:5000/api/eleves/${eleveId}`);
        const eleveData = await eleveResponse.json();

        // Charger les notes
        const rawNotes = await getNotesForEleve(eleveId);
        
        // Normaliser les notes pour garantir que toutes ont une valeur numérique
        const notes = normalizeNotes(rawNotes);

        // Organiser les notes par matière
        const notesByMatiere = notes.reduce((acc, note) => {
          const matiereId = note.matiereId;
          if (!acc[matiereId]) {
            acc[matiereId] = {
              matiere: note.matiere || { id: matiereId, nom: note.matiereName || `Matière ${matiereId}` },
              notes: []
            };
          }
          acc[matiereId].notes.push(note);
          return acc;
        }, {});

        // Calculer les moyennes par matière
        const matieresSummary = Object.values(notesByMatiere).map(({ matiere, notes }) => {
          const moyenne = notes.reduce((sum, note) => sum + note.note, 0) / notes.length;
          // Trier les notes par date (plus récente d'abord)
          const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));
          return {
            matiere,
            moyenne: moyenne.toFixed(2),
            nombreNotes: notes.length,
            notes: sortedNotes,
            // Déterminer la tendance (en hausse, stable, en baisse)
            tendance: sortedNotes.length >= 2 ? 
              (sortedNotes[0].note > sortedNotes[sortedNotes.length - 1].note ? 'up' : 
               sortedNotes[0].note < sortedNotes[sortedNotes.length - 1].note ? 'down' : 'stable')
              : 'stable'
          };
        });

        // Trier les matières par moyenne (décroissant)
        matieresSummary.sort((a, b) => parseFloat(b.moyenne) - parseFloat(a.moyenne));

        // Calculer la moyenne générale
        const moyenneGenerale = matieresSummary.length > 0 ?
          matieresSummary.reduce((sum, matiere) => sum + parseFloat(matiere.moyenne), 0) / matieresSummary.length :
          0;

        setBulletinData({
          eleve: eleveData,
          matieres: matieresSummary,
          moyenneGenerale: moyenneGenerale.toFixed(2)
        });

      } catch (error) {
        console.error('Erreur lors du chargement du bulletin:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBulletinData();
  }, []);
  
  // Fonctions utilitaires pour le bulletin
  const getAppreciation = (moyenne) => {
    if (moyenne >= 16) return 'Excellent';
    if (moyenne >= 14) return 'Très bien';
    if (moyenne >= 12) return 'Bien';
    if (moyenne >= 10) return 'Assez bien';
    return 'Des efforts sont nécessaires';
  };

  const getMoyenneColor = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    if (moyenneNum >= 16) return 'text-green-600';
    if (moyenneNum >= 14) return 'text-blue-600';
    if (moyenneNum >= 12) return 'text-emerald-600';
    if (moyenneNum >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    if (moyenneNum >= 16) return 'bg-green-500';
    if (moyenneNum >= 14) return 'bg-blue-500';
    if (moyenneNum >= 12) return 'bg-emerald-500';
    if (moyenneNum >= 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getProgressWidth = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    return `${(moyenneNum / 20) * 100}%`;
  };
  
  const getTendanceIcon = (tendance) => {
    switch(tendance) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const toggleMatiere = (matiereId) => {
    if (expandedMatiere === matiereId) {
      setExpandedMatiere(null);
    } else {
      setExpandedMatiere(matiereId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement du bulletin...</p>
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

  if (!bulletinData) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-12">
      {/* En-tête du bulletin avec design amélioré */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Bannière supérieure avec dégradé */}
        <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bulletinData.eleve.nom}
                </h1>
                <p className="text-gray-600">
                  Classe: {bulletinData.eleve.classe}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Année scolaire {getCurrentSchoolYear()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="w-5 h-5 text-blue-600" />
                <select
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="semestre1">Premier semestre</option>
                  <option value="semestre2">Deuxième semestre</option>
                  <option value="annee">Année complète</option>
                </select>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <p className="text-blue-700 font-medium mb-2 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Moyenne générale
              </p>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-3xl font-bold ${getMoyenneColor(bulletinData.moyenneGenerale)}`}>
                    {bulletinData.moyenneGenerale}
                  </span>
                  <span className="text-gray-500">/20</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(bulletinData.moyenneGenerale)}`}
                    style={{width: getProgressWidth(bulletinData.moyenneGenerale)}}
                  ></div>
                </div>
              </div>
              <p className="text-sm mt-3 text-gray-600 font-medium">
                {getAppreciation(bulletinData.moyenneGenerale)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé graphique des performances */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Performance par matière
        </h2>
        
        <div className="space-y-4">
          {bulletinData.matieres.map((matiere) => (
            <div 
              key={matiere.matiere.id} 
              className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between cursor-pointer" 
                   onClick={() => toggleMatiere(matiere.matiere.id)}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getProgressColor(matiere.moyenne)} bg-opacity-20`}>
                    <BookOpen className={`w-5 h-5 ${getMoyenneColor(matiere.moyenne)}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{matiere.matiere.nom}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{matiere.nombreNotes} notes</span>
                      {getTendanceIcon(matiere.tendance)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`text-xl font-bold ${getMoyenneColor(matiere.moyenne)}`}>
                      {matiere.moyenne}
                    </span>
                    <span className="text-gray-500 text-sm">/20</span>
                  </div>
                  <div className={`transition-transform ${expandedMatiere === matiere.matiere.id ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Détails des notes - affiché uniquement si la matière est développée */}
              {expandedMatiere === matiere.matiere.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Détail des notes</p>
                  <div className="grid grid-cols-1 gap-2">
                    {matiere.notes.map((note, index) => (
                      <div key={index} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">
                            {note.titre || `Évaluation ${index + 1}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(note.date)}
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
                          note.note >= 15 ? 'bg-green-100 text-green-800' :
                          note.note >= 10 ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {note.note}/20
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Appréciation générale redesignée */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Appréciation générale
        </h2>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
          {parseFloat(bulletinData.moyenneGenerale) >= 14 && (
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full mt-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-800">
                <span className="font-medium">{getAppreciation(bulletinData.moyenneGenerale)}.</span> Vous faites preuve d&apos;un travail sérieux et constant.
              </p>
            </div>
          )}
          
          <p className="text-gray-700">
            {bulletinData.moyenneGenerale >= 10 
              ? `Félicitations pour ces résultats ! ${parseFloat(bulletinData.moyenneGenerale) >= 16 
                  ? "Vous avez fait preuve d'un excellent niveau et d'une grande rigueur de travail."
                  : "Continuez vos efforts et maintenez cette régularité dans votre travail."}`
              : "Un travail plus régulier et approfondi est nécessaire. N'hésitez pas à solliciter de l'aide auprès de vos professeurs pour progresser."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default BulletinEleve;