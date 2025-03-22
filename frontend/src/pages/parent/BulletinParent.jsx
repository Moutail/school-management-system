import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Award, 
  Calendar, 
  User,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Book,
  CheckCircle,
  Printer
} from 'lucide-react';
import { API_URL } from '../../config/api.config';

function BulletinParent() {
  const [bulletinData, setBulletinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriode, setSelectedPeriode] = useState('semestre1');
  const [expandedMatiere, setExpandedMatiere] = useState(null);
  
  // Récupérer l'ID de l'élève depuis l'URL
  const [searchParams] = useSearchParams();
  const eleveId = searchParams.get('eleveId');

  // Fonction pour normaliser les données de notes
  const normalizeNotes = (notesArray) => {
    // S'assurer que notesArray est un tableau
    if (!Array.isArray(notesArray)) return [];
    
    return notesArray.map(note => {
      // Vérifier si la note est présente et valide, sinon essayer valeur
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
    }).filter(note => !isNaN(note.note)); // Éliminer les notes non numériques
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
        
        if (!eleveId) {
          throw new Error('Identifiant élève non spécifié');
        }

        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Charger les informations de l'élève
        const eleveResponse = await fetch(
          `${API_URL}/eleves/${eleveId}?userId=${userId}&userRole=${userRole}`, 
          { headers }
        );
        
        if (!eleveResponse.ok) {
          throw new Error('Impossible d\'accéder aux informations de cet élève');
        }
        
        const eleveData = await eleveResponse.json();

        // Charger les notes avec les paramètres parent
        const notesResponse = await fetch(
          `${API_URL}/notes/eleve/${eleveId}?userId=${userId}&userRole=${userRole}`,
          { headers }
        );
        
        if (!notesResponse.ok) {
          throw new Error('Impossible d\'accéder aux notes de cet élève');
        }
        
        const rawNotes = await notesResponse.json();
        
        // Normaliser les notes pour garantir que toutes ont une valeur numérique
        const notes = normalizeNotes(rawNotes);

        // Organiser les notes par matière
        const notesByMatiere = {};
        
        notes.forEach(note => {
          const matiereId = note.matiereId;
          const matiereName = note.matiereName || 'Non spécifiée';
          
          if (!notesByMatiere[matiereId]) {
            notesByMatiere[matiereId] = {
              matiere: { id: matiereId, nom: matiereName },
              notes: []
            };
          }
          notesByMatiere[matiereId].notes.push(note);
        });

        // Calculer les moyennes par matière
        const matieresSummary = Object.values(notesByMatiere).map(({ matiere, notes }) => {
          const totalNotes = notes.reduce((sum, note) => sum + note.note, 0);
          const moyenne = notes.length > 0 ? totalNotes / notes.length : 0;
          
          // Trier les notes par date (plus récente d'abord)
          const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Déterminer la tendance
          const tendance = sortedNotes.length >= 2 ? 
            (sortedNotes[0].note > sortedNotes[sortedNotes.length - 1].note ? 'up' : 
            sortedNotes[0].note < sortedNotes[sortedNotes.length - 1].note ? 'down' : 'stable')
            : 'stable';
          
          return {
            matiere,
            moyenne: moyenne.toFixed(2),
            nombreNotes: notes.length,
            notes: sortedNotes,
            tendance
          };
        });
        
        // Trier les matières par moyenne décroissante
        matieresSummary.sort((a, b) => parseFloat(b.moyenne) - parseFloat(a.moyenne));

        // Calculer la moyenne générale si il y a des matières
        const moyenneGenerale = matieresSummary.length > 0
          ? matieresSummary.reduce((sum, matiere) => sum + parseFloat(matiere.moyenne), 0) / matieresSummary.length
          : 0;

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
  }, [eleveId]);

  // Ajouter une nouvelle fonction pour filtrer les notes en fonction de la période
  const getFilteredNotes = (notes, periode) => {
    if (periode === 'annee') return notes;
    
    return notes.filter(note => {
      // Vérifier si note a une date valide
      if (!note.date) return false;
      
      try {
        const noteDate = new Date(note.date);
        if (isNaN(noteDate.getTime())) return false; // Date invalide
        
        const month = noteDate.getMonth() + 1; // Les mois commencent à 0
        
        // Premier semestre: Septembre (9) à Janvier (1)
        if (periode === 'semestre1') {
          return (month >= 9 && month <= 12) || month === 1;
        }
        
        // Deuxième semestre: Février (2) à Juin (6)
        return month >= 2 && month <= 6;
      } catch (e) {
        console.error("Erreur lors du parsing de la date:", e);
        return false;
      }
    });
  };

  const getAppreciation = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    if (moyenneNum >= 16) return 'Excellent';
    if (moyenneNum >= 14) return 'Très bien';
    if (moyenneNum >= 12) return 'Bien';
    if (moyenneNum >= 10) return 'Assez bien';
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
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  const toggleMatiere = (matiereId) => {
    if (expandedMatiere === matiereId) {
      setExpandedMatiere(null);
    } else {
      setExpandedMatiere(matiereId);
    }
  };

  const getFilteredBulletinData = () => {
    if (!bulletinData) return null;
    
    // Créer une copie pour ne pas modifier les données originales
    const filteredData = { ...bulletinData };
    
    // Filtrer les notes de chaque matière
    filteredData.matieres = bulletinData.matieres.map(matiere => {
      const filteredNotes = getFilteredNotes(matiere.notes, selectedPeriode);
      
      // Recalculer la moyenne
      const totalNotes = filteredNotes.reduce((sum, note) => sum + parseFloat(note.note), 0);
      const moyenne = filteredNotes.length > 0 ? totalNotes / filteredNotes.length : 0;
      
      // Déterminer la tendance
      const sortedNotes = [...filteredNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
      const tendance = sortedNotes.length >= 2 ? 
        (sortedNotes[0].note > sortedNotes[sortedNotes.length - 1].note ? 'up' : 
         sortedNotes[0].note < sortedNotes[sortedNotes.length - 1].note ? 'down' : 'stable')
        : 'stable';
      
      return {
        ...matiere,
        notes: filteredNotes,
        moyenne: moyenne.toFixed(2),
        nombreNotes: filteredNotes.length,
        tendance
      };
    });
    
    // Recalculer la moyenne générale
    if (filteredData.matieres.length > 0) {
      const moyenneGenerale = filteredData.matieres.reduce(
        (sum, matiere) => sum + parseFloat(matiere.moyenne), 0
      ) / filteredData.matieres.length;
      
      filteredData.moyenneGenerale = moyenneGenerale.toFixed(2);
    }
    
    return filteredData;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-700">Chargement du bulletin...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/parent" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 inline-flex items-center transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  if (!bulletinData) return null;
  
  // Utiliser les données filtrées dans votre rendu
  const filteredBulletin = getFilteredBulletinData();

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Bouton de retour */}
        <Link to="/parent" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-2 bg-white rounded-xl shadow-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
        
        {/* En-tête du bulletin */}
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
                    {filteredBulletin.eleve.nom}
                  </h1>
                  <p className="text-gray-600">
                    Classe: {filteredBulletin.eleve.classe || filteredBulletin.eleve.classeId}
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
                    <span className={`text-3xl font-bold ${getMoyenneColor(filteredBulletin.moyenneGenerale)}`}>
                      {filteredBulletin.moyenneGenerale}
                    </span>
                    <span className="text-gray-500">/20</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(filteredBulletin.moyenneGenerale)}`}
                      style={{width: getProgressWidth(filteredBulletin.moyenneGenerale)}}
                    ></div>
                  </div>
                </div>
                <p className="text-sm mt-3 text-gray-600 font-medium">
                  {getAppreciation(filteredBulletin.moyenneGenerale)}
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
          
          {filteredBulletin.matieres.length > 0 ? (
            <div className="space-y-4">
              {filteredBulletin.matieres.map((matiere) => (
                <div 
                  key={matiere.matiere.id} 
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between cursor-pointer" 
                      onClick={() => toggleMatiere(matiere.matiere.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getProgressColor(matiere.moyenne)} bg-opacity-20`}>
                        <Book className={`w-5 h-5 ${getMoyenneColor(matiere.moyenne)}`} />
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
          ) : (
            <div className="p-6 text-center bg-gray-50 rounded-xl">
              <p className="text-gray-500">
                {selectedPeriode === 'annee' 
                  ? "Aucune note disponible pour cet élève actuellement."
                  : selectedPeriode === 'semestre1'
                    ? "Aucune note disponible pour le premier semestre."
                    : "Aucune note disponible pour le deuxième semestre."}
              </p>
            </div>
          )}
        </div>

        {/* Appréciation générale redesignée */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Appréciation générale
          </h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
            {filteredBulletin.matieres.length > 0 && filteredBulletin.matieres.some(m => m.nombreNotes > 0) ? (
              <>
                {parseFloat(filteredBulletin.moyenneGenerale) >= 14 && (
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-full mt-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-gray-800">
                      <span className="font-medium">{getAppreciation(filteredBulletin.moyenneGenerale)}.</span> L&apos;élève fait preuve d&apos;un travail sérieux et constant.
                    </p>
                  </div>
                )}
                
                <p className="text-gray-700">
                  {parseFloat(filteredBulletin.moyenneGenerale) >= 10 
                    ? `Félicitations pour ces résultats ! ${parseFloat(filteredBulletin.moyenneGenerale) >= 16 
                        ? "L'élève a fait preuve d'un excellent niveau et d'une grande rigueur de travail."
                        : "Continuez à encourager la régularité dans le travail de l'élève."}`
                    : "Un travail plus régulier et approfondi est nécessaire. N'hésitez pas à contacter les professeurs pour un suivi personnalisé des progrès de l'élève."}
                </p>
              </>
            ) : (
              <p className="text-gray-600">
                {selectedPeriode === 'annee'
                  ? "Aucune note disponible pour établir une appréciation."
                  : selectedPeriode === 'semestre1'
                    ? "Aucune note disponible pour le premier semestre."
                    : "Aucune note disponible pour le deuxième semestre."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulletinParent;
