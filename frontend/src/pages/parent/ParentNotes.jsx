// pages/parent/ParentNotes.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Calendar, 
  TrendingUp, TrendingDown, Filter,
  Search, ChevronRight, Book, AlertCircle,
  ArrowRight, Download
} from 'lucide-react';

function ParentNotes() {
  const [notes, setNotes] = useState([]);
  const [eleve, setEleve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [stats, setStats] = useState({ average: 0, best: 0, worst: 20, count: 0, above15: 0, below10: 0 });
  const { eleveId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Récupérer les infos de l'élève
        const eleveRes = await fetch(`http://localhost:5000/api/eleves/${eleveId}`, { headers });
        
        if (eleveRes.ok) {
          const eleveData = await eleveRes.json();
          setEleve(eleveData);
        } else {
          console.error('Erreur lors de la récupération de l\'élève:', eleveRes.status);
          setEleve(null);
        }
  
        // Récupérer les notes
        const notesRes = await fetch(
          `http://localhost:5000/api/notes/eleve/${eleveId}?userId=${userId}&userRole=parent`, 
          { headers }
        );
        
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          const normalizedNotes = Array.isArray(notesData) 
            ? normalizeNotes(notesData) 
            : [];
          
          setNotes(normalizedNotes);
          
          // Extraire les matières uniques
          const uniqueMatieres = [];
          const matiereIds = new Set();
          
          normalizedNotes.forEach(note => {
            const matiereId = note.matiereId;
            if (matiereId && !matiereIds.has(matiereId)) {
              matiereIds.add(matiereId);
              uniqueMatieres.push({
                id: matiereId,
                nom: note.matiereName || `Matière ${matiereId}`
              });
            }
          });
          
          setMatieres(uniqueMatieres);
          
          // Calculer les statistiques
          calculateStats(normalizedNotes);
        } else {
          console.error('Erreur lors de la récupération des notes:', notesRes.status);
          setNotes([]);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [eleveId]);

  // Normaliser les notes
  const normalizeNotes = (notesArray) => {
    return notesArray.map(note => {
      let noteValue = parseFloat(note.note);
      
      if (isNaN(noteValue) && note.valeur !== undefined) {
        noteValue = parseFloat(note.valeur);
      }
      
      return {
        ...note,
        note: noteValue
      };
    }).filter(note => !isNaN(note.note));
  };

  // Calculer les statistiques
  const calculateStats = (notesArray) => {
    if (notesArray.length === 0) {
      setStats({ average: 0, best: 0, worst: 0, count: 0, above15: 0, below10: 0 });
      return;
    }
    
    let sum = 0;
    let best = 0;
    let worst = 20;
    let above15 = 0;
    let below10 = 0;
    
    notesArray.forEach(note => {
      sum += note.note;
      best = Math.max(best, note.note);
      worst = Math.min(worst, note.note);
      
      if (note.note >= 15) above15++;
      if (note.note < 10) below10++;
    });
    
    setStats({
      average: (sum / notesArray.length).toFixed(2),
      best: best.toFixed(2),
      worst: worst.toFixed(2),
      count: notesArray.length,
      above15,
      below10
    });
  };
  
  // Formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Filtrer les notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = (note.matiereName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (note.commentaire || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMatiere = selectedMatiere === '' || note.matiereId === selectedMatiere;
    
    return matchesSearch && matchesMatiere;
  });
  
  // Trier par date (plus récent d'abord)
  const sortedNotes = [...filteredNotes].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-700">Chargement des notes...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/parent" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-2 bg-white rounded-xl shadow-sm transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Notes et évaluations - {eleve?.nom || 'Élève non trouvé'}
          </h1>
          <p className="text-gray-500">
            Classe: {eleve?.classe || eleve?.classeId}
          </p>
        </div>
        
        {!eleve ? (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="bg-red-50 p-4 rounded-xl text-center">
              <div className="bg-red-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-medium text-red-800 mb-1">Information non disponible</h3>
              <p className="text-red-700">
                Impossible de récupérer les informations de cet élève.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filtres et résumé statistique */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Récapitulatif des notes</h2>
                  <div className="flex gap-3 w-full sm:w-auto">
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
                        value={selectedMatiere}
                        onChange={(e) => setSelectedMatiere(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none"
                      >
                        <option value="">Toutes les matières</option>
                        {matieres.map((matiere) => (
                          <option key={matiere.id} value={matiere.id}>
                            {matiere.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700 mb-1">Moyenne générale</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-blue-800">
                        {stats.average}
                      </span>
                      <span className="text-gray-500 text-sm">/20</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <p className="text-sm text-green-700 mb-1">Meilleure note</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-green-800">
                        {stats.best}
                      </span>
                      <span className="text-gray-500 text-sm">/20</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-700 mb-1">Note la plus basse</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-amber-800">
                        {stats.worst}
                      </span>
                      <span className="text-gray-500 text-sm">/20</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-700">Répartition des notes</h3>
                    <p className="text-sm text-gray-500">Total: {stats.count} notes</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-700">Notes ≥ 15</span>
                        <span className="font-medium">{stats.above15} notes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${stats.count ? (stats.above15 / stats.count) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">Notes entre 10 et 15</span>
                        <span className="font-medium">{stats.count - stats.above15 - stats.below10} notes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${stats.count ? ((stats.count - stats.above15 - stats.below10) / stats.count) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-700">Notes inférieur à 10</span>
                        <span className="font-medium">{stats.below10} notes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${stats.count ? (stats.below10 / stats.count) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Bulletin complet
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 mb-6">
                  <p className="text-blue-700 mb-3">
                    Accédez au bulletin complet avec les moyennes, appréciations et statistiques détaillées par matière.
                  </p>
                  
                  <Link 
                    to={`/parent/bulletin?eleveId=${eleveId}`}
                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Voir le bulletin
                  </Link>
                </div>
                
                <h3 className="font-medium text-gray-700 mb-3">Matières évaluées</h3>
                <div className="space-y-2">
                  {matieres.map(matiere => (
                    <div 
                      key={matiere.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Book className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{matiere.nom}</span>
                      </div>
                      <button
                        onClick={() => setSelectedMatiere(matiere.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Liste des notes */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold">Historique des notes</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} {selectedMatiere ? 'dans cette matière' : 'au total'}
                </p>
              </div>
              
              {sortedNotes.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune note disponible</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {notes.length === 0 
                      ? "Aucune note n'a encore été enregistrée pour cet élève."
                      : "Aucune note ne correspond à votre recherche."}
                  </p>
                  {(searchTerm || selectedMatiere) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedMatiere('');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left tracking-wider">Matière</th>
                        <th className="px-6 py-3 text-left tracking-wider">Note</th>
                        <th className="px-6 py-3 text-left tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left tracking-wider">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedNotes.map((note, index) => (
                        <tr key={note.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="mr-3 bg-blue-100 p-2 rounded-lg">
                                <Book className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900">
                                {note.matiereName || 'Matière non spécifiée'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-lg ${
                              note.note >= 15 ? 'bg-green-100 text-green-800' : 
                              note.note >= 10 ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {note.note} / 20
                            </span>
                            <span className="ml-2 text-gray-400">
                              {note.note >= 15 ? <TrendingUp className="w-4 h-4 text-green-500 inline" /> : 
                               note.note < 10 ? <TrendingDown className="w-4 h-4 text-red-500 inline" /> : null}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {formatDate(note.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs">
                              {note.commentaire ? (
                                <div className="line-clamp-2">{note.commentaire}</div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Ressources pédagogiques */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-md p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Ressources pédagogiques</h3>
              <p className="text-blue-100">
                Accédez aux cours et supports pour aider votre enfant dans ses études.
              </p>
            </div>
            <div className="ml-auto">
              <Link 
                to={`/parent/eleve/${eleveId}/cours`}
                className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                <span>Voir les cours</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentNotes;