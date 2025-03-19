import { useState, useEffect } from 'react';
import { 
  Award, Printer, Download,
  FileText, ChevronDown, ChevronRight,
  Star, Grid, List,
  Check, AlertTriangle, Info
} from 'lucide-react';
import PropTypes from 'prop-types';

function StudentBulletin({ eleveId }) {
  const [bulletinData, setBulletinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('semester1');
  const [matieres, setMatieres] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'

  // Fonction pour normaliser les notes venant de différentes sources
  const normalizeNotes = (notesArray) => {
    if (!Array.isArray(notesArray)) return [];
    
    return notesArray.map(note => {
      // Essayer d'extraire la valeur numérique de la note
      let noteValue = parseFloat(note.note);
      
      // Si note n'est pas valide, essayer d'utiliser valeur
      if (isNaN(noteValue) && note.valeur !== undefined) {
        noteValue = parseFloat(note.valeur);
      }
      
      return {
        ...note,
        note: noteValue,
        sourceType: note.exerciceId ? 'exercice' : 'standard'
      };
    }).filter(note => !isNaN(note.note)); // Éliminer les notes non numériques
  };

  useEffect(() => {
    const fetchBulletinData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les notes de l'élève
        const notesResponse = await fetch(`/api/notes/eleve/${eleveId}`);
        if (!notesResponse.ok) throw new Error('Erreur lors du chargement des notes');
        const rawNotesData = await notesResponse.json();
        
        // Normaliser les notes pour garantir l'uniformité des données
        const notesData = normalizeNotes(rawNotesData);

        // Récupérer les informations de l'élève
        const eleveResponse = await fetch(`/api/eleves/${eleveId}`);
        if (!eleveResponse.ok) throw new Error('Erreur lors du chargement des données élève');
        const eleveData = await eleveResponse.json();

        // Récupérer les informations de la classe
        const classeResponse = await fetch(`/api/classes/${eleveData.classeId}`);
        if (!classeResponse.ok) throw new Error('Erreur lors du chargement des données classe');
        const classeData = await classeResponse.json();

        // Créer un mapping des matières pour un accès facile
        const matieresMap = {};
        classeData.matieres?.forEach(matiere => {
          matieresMap[matiere.id] = matiere.nom;
        });
        setMatieres(matieresMap);

        // Organiser les données
        const bulletin = {
          eleve: eleveData,
          notes: notesData,
          classe: classeData,
          semester: selectedPeriod
        };

        setBulletinData(bulletin);
      } catch (error) {
        console.error('Erreur lors du chargement du bulletin:', error);
        setError(error.message || "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    if (eleveId) {
      fetchBulletinData();
    }
  }, [eleveId, selectedPeriod]);

  const formatDate = (date) => {
    try {
      const options = { day: "numeric", month: "long", year: "numeric" };
      return new Date(date).toLocaleDateString("fr-FR", options);
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return "Date invalide";
    }
  };

  const calculateMatiereAverage = (notes, matiereId) => {
    const matiereNotes = notes.filter(note => note.matiereId === matiereId);
    if (!matiereNotes.length) return null;
    
    // Comme les notes sont normalisées, on peut calculer directement la moyenne
    return matiereNotes.reduce((sum, note) => sum + note.note, 0) / matiereNotes.length;
  };

  const calculateOverallAverage = (notes) => {
    if (!notes || !notes.length) return 0;
    return notes.reduce((sum, note) => sum + note.note, 0) / notes.length;
  };

  const getAppreciation = (moyenne) => {
    if (!moyenne) return 'Non évalué';
    if (moyenne >= 16) return 'Excellent';
    if (moyenne >= 14) return 'Très bien';
    if (moyenne >= 12) return 'Bien';
    if (moyenne >= 10) return 'Assez bien';
    return 'Des efforts sont nécessaires';
  };
  
  const getNoteColor = (note) => {
    if (!note) return 'bg-gray-100 text-gray-800';
    if (note >= 16) return 'bg-green-100 text-green-800';
    if (note >= 14) return 'bg-blue-100 text-blue-800';
    if (note >= 12) return 'bg-teal-100 text-teal-800';
    if (note >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const getProgressColor = (moyenne) => {
    if (!moyenne) return 'bg-gray-300';
    if (moyenne >= 16) return 'bg-green-500';
    if (moyenne >= 14) return 'bg-blue-500';
    if (moyenne >= 12) return 'bg-teal-500';
    if (moyenne >= 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getProgressWidth = (moyenne) => {
    if (!moyenne) return '0%';
    return `${(moyenne / 20) * 100}%`;
  };

  const handlePrint = () => {
    window.print();
  };
  
  // Sélectionner l'année scolaire courante
  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Si entre septembre et décembre, l'année scolaire est année-année+1
    if (month >= 8) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-blue-600 font-medium">Chargement du bulletin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
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

  if (!bulletinData || !bulletinData.eleve) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-blue-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
          <Info className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune donnée</h3>
        <p className="text-gray-600">Aucune donnée disponible pour cet élève</p>
      </div>
    );
  }

  // Identifier les matières uniques qui ont des notes
  const uniqueMatieres = [...new Set(bulletinData.notes.map(note => note.matiereId))];
  const overallAverage = calculateOverallAverage(bulletinData.notes);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-12 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-2xl shadow-md p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletin Scolaire</h1>
          <p className="text-gray-500 mt-1">Année scolaire {getCurrentSchoolYear()}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="pl-4 pr-10 py-2.5 appearance-none border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="semester1">1er Semestre</option>
              <option value="semester2">2ème Semestre</option>
              <option value="annual">Année complète</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              title="Vue en grille"
            >
              <Grid className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              title="Vue en liste"
            >
              <List className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span className="font-medium">Imprimer</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">PDF</span>
          </button>
        </div>
      </div>

      {/* Informations de l'élève */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">
                {bulletinData.eleve.nom.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{bulletinData.eleve.nom}</h2>
              <p className="text-gray-600">Classe: {bulletinData.classe?.nom || "Non spécifiée"}</p>
              <p className="text-gray-600 mt-1">Date de naissance: {formatDate(bulletinData.eleve.dateNaissance)}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-800">Moyenne générale</h3>
              <Award className="w-5 h-5 text-blue-700" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-bold text-blue-700">{overallAverage.toFixed(2)}</span>
              <span className="text-gray-600">/20</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(overallAverage)}`}
                style={{width: getProgressWidth(overallAverage)}}
              ></div>
            </div>
            <p className="text-sm text-blue-700 font-medium mt-3">{getAppreciation(overallAverage)}</p>
          </div>
        </div>
      </div>

      {/* Détail des notes par matière */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {uniqueMatieres.map((matiereId) => {
            const moyenne = calculateMatiereAverage(bulletinData.notes, matiereId);
            const notesCount = bulletinData.notes.filter(note => note.matiereId === matiereId).length;
            const matiereName = matieres[matiereId] || `Matière ${matiereId}`;
            
            return (
              <div key={matiereId} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">{matiereName}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-sm font-medium ${getNoteColor(moyenne)}`}>
                    {moyenne ? moyenne.toFixed(2) : 'N/A'}/20
                  </div>
                </div>
                
                <div className="mt-2 mb-4">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(moyenne)}`}
                      style={{width: getProgressWidth(moyenne)}}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{notesCount} évaluation{notesCount > 1 ? 's' : ''}</span>
                  <span className="text-blue-700 font-medium">{getAppreciation(moyenne)}</span>
                </div>
                
                <button
                  onClick={() => setShowDetails(matiereId === showDetails ? null : matiereId)}
                  className="w-full mt-4 pt-4 border-t border-gray-100 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 font-medium"
                >
                  <span>{matiereId === showDetails ? 'Masquer les détails' : 'Voir les détails'}</span>
                  {matiereId === showDetails ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {matiereId === showDetails && (
                  <div className="mt-4 space-y-2">
                    {bulletinData.notes
                      .filter(note => note.matiereId === matiereId)
                      .map((note, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">
                              {note.titre || `Évaluation ${idx + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(note.date)}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-sm font-medium ${getNoteColor(note.note)}`}>
                            {note.note}/20
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matière
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Moyenne
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Évaluations
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appréciation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {uniqueMatieres.map((matiereId) => {
                const moyenne = calculateMatiereAverage(bulletinData.notes, matiereId);
                const notesCount = bulletinData.notes.filter(note => note.matiereId === matiereId).length;
                const matiereName = matieres[matiereId] || `Matière ${matiereId}`;

                return (
                  <tr key={matiereId} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setShowDetails(matiereId === showDetails ? null : matiereId)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg mr-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{matiereName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${getNoteColor(moyenne)}`}>
                        {moyenne ? moyenne.toFixed(2) : 'N/A'}/20
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notesCount} évaluation{notesCount > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {getAppreciation(moyenne)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Appréciation générale */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-amber-500" />
          Appréciation générale
        </h2>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          {overallAverage >= 14 && (
            <div className="flex items-start gap-4 mb-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-800">
                <span className="font-medium">{getAppreciation(overallAverage)}.</span> Élève faisant preuve d&apos;un travail sérieux et constant.
              </p>
            </div>
          )}
          
          <p className="text-gray-700">
            {overallAverage >= 10 
              ? `Félicitations pour ces résultats ! ${overallAverage >= 16 
                  ? "L'élève a fait preuve d'un excellent niveau et d'une grande rigueur dans son travail."
                  : "L'élève doit continuer ses efforts et maintenir cette régularité dans son travail."}`
              : "Un travail plus régulier et approfondi est nécessaire. L'élève est encouragé à solliciter de l'aide auprès de ses professeurs pour progresser."}
          </p>
        </div>
      </div>
    </div>
  );
}

StudentBulletin.propTypes = {
  eleveId: PropTypes.string.isRequired
};

export default StudentBulletin;