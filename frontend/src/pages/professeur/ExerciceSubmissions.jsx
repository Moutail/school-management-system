import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, FileText, 
  AlertCircle, Calendar, User, Book, ChevronDown, Filter,
  Save, MessageSquare, Clock, AlertTriangle,
  Award, BarChart2,
  X,
  Edit2
} from 'lucide-react';

function ExerciceSubmissions() {
  const { exerciceId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [exercice, setExercice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        // Récupérer les détails de l'exercice
        const exerciceRes = await fetch(`http://localhost:5000/api/exercices/${exerciceId}?userId=${userId}&userRole=${userRole}`);
        
        if (!exerciceRes.ok) {
          throw new Error(`Erreur lors de la récupération de l'exercice (${exerciceRes.status})`);
        }
        
        const exerciceData = await exerciceRes.json();
        setExercice(exerciceData);
        
        // Récupérer les soumissions
        const submissionsRes = await fetch(`http://localhost:5000/api/exercices/soumissions/${exerciceId}?userId=${userId}&userRole=${userRole}`);
        
        if (!submissionsRes.ok) {
          throw new Error(`Erreur lors de la récupération des soumissions (${submissionsRes.status})`);
        }
        
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [exerciceId]);

  const handleDownload = (id) => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    window.open(`http://localhost:5000/api/exercices/soumissions/${id}/download?userId=${userId}&userRole=${userRole}`, '_blank');
  };
  
  const openNoteModal = (submission) => {
    setSelectedSubmission(submission);
    setNoteValue(submission.note || '');
    setCommentaire(submission.commentaire || '');
    setNoteModalOpen(true);
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;
    
    try {
      const note = parseFloat(noteValue);
      
      if (isNaN(note) || note < 0 || note > 20) {
        alert('Veuillez entrer une note valide entre 0 et 20');
        return;
      }
      
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`http://localhost:5000/api/exercices/soumissions/${selectedSubmission.id}/noter?userId=${userId}&userRole=${userRole}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note,
          commentaire
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la notation');
      }
      
      const updatedSubmission = await response.json();
      
      // Mettre à jour la liste des soumissions
      setSubmissions(submissions.map(s => 
        s.id === selectedSubmission.id ? updatedSubmission : s
      ));
      
      setNoteModalOpen(false);
      
      // Afficher une notification de succès
      const noteElement = document.createElement('div');
      noteElement.className = 'fixed top-4 right-4 bg-green-100 text-green-800 p-4 rounded-lg shadow-md z-50 flex items-center gap-2';
      noteElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Note enregistrée avec succès</span>
      `;
      document.body.appendChild(noteElement);
      setTimeout(() => {
        document.body.removeChild(noteElement);
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  };
  
  // Calculer le retard
  const calculateDelay = (dateLimit, dateSubmission) => {
    if (!dateLimit || !dateSubmission) return null;
    
    const limit = new Date(dateLimit);
    const submission = new Date(dateSubmission);
    
    // Si soumis avant la date limite
    if (submission <= limit) return { late: false, text: 'À temps' };
    
    // Calculer le retard
    const diff = submission - limit;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let delayText = '';
    if (days > 0) {
      delayText = `${days} jour${days > 1 ? 's' : ''}`;
      if (hours > 0) delayText += ` et ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      delayText = `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    return { late: true, text: `En retard de ${delayText}` };
  };

  // Filtrer les soumissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.eleveNom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'note' && sub.note) ||
                          (statusFilter === 'nonNote' && !sub.note);
    return matchesSearch && matchesStatus;
  });

  // Trier les soumissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.dateSoumission) - new Date(a.dateSoumission);
    } else if (sortOrder === 'oldest') {
      return new Date(a.dateSoumission) - new Date(b.dateSoumission);
    } else if (sortOrder === 'nameAsc') {
      return (a.eleveNom || '').localeCompare(b.eleveNom || '');
    } else if (sortOrder === 'nameDesc') {
      return (b.eleveNom || '').localeCompare(a.eleveNom || '');
    } else if (sortOrder === 'note') {
      // Les notes null à la fin
      if (a.note === null && b.note !== null) return 1;
      if (a.note !== null && b.note === null) return -1;
      if (a.note === null && b.note === null) return 0;
      return b.note - a.note;
    }
    return 0;
  });

  // Calculer les statistiques
  const getNoteStats = () => {
    const notedSubmissions = submissions.filter(s => s.note !== null && s.note !== undefined);
    if (notedSubmissions.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
    
    const notes = notedSubmissions.map(s => s.note);
    return {
      avg: (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2),
      max: Math.max(...notes).toFixed(2),
      min: Math.min(...notes).toFixed(2),
      count: notedSubmissions.length
    };
  };

  const stats = getNoteStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-blue-600 font-medium">Chargement des soumissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/professeur/exercices')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux exercices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Navigation de retour */}
      <div>
        <button 
          onClick={() => navigate('/professeur/exercices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux exercices</span>
        </button>
      </div>

      {/* En-tête de l'exercice */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Soumissions pour: {exercice?.titre}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Book className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">Informations</h3>
            </div>
            <div className="space-y-3 ml-11">
              <p className="text-gray-700">
                <span className="font-medium">Classe:</span> {exercice?.classeNom || "Non spécifiée"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Matière:</span> {exercice?.matiereNom || "Non spécifiée"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date limite:</span> {exercice?.dateLimit 
                  ? formatDate(exercice.dateLimit) 
                  : "Non spécifiée"}
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 p-5 rounded-xl border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">Notes</h3>
            </div>
            <div className="space-y-3 ml-11">
              <p className="text-gray-700">
                <span className="font-medium">Moyenne:</span> {stats.avg}/20
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Note max:</span> {stats.max}/20
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Note min:</span> {stats.min}/20
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BarChart2 className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-amber-800">Statistiques</h3>
            </div>
            <div className="space-y-3 ml-11">
              <p className="text-gray-700">
                <span className="font-medium">Total soumissions:</span> {submissions.length}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Notées:</span> {stats.count}/{submissions.length}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">En attente:</span> {submissions.length - stats.count}/{submissions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="note">Notées</option>
              <option value="nonNote">Non notées</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="nameAsc">Nom (A-Z)</option>
              <option value="nameDesc">Nom (Z-A)</option>
              <option value="note">Meilleures notes</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Liste des soumissions */}
      {sortedSubmissions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-md text-center">
          <div className="bg-gray-100 w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune soumission trouvée</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== 'all'
              ? "Aucune soumission ne correspond à vos critères de recherche."
              : "Les élèves n'ont pas encore soumis de réponses pour cet exercice."}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedSubmissions.map((submission) => {
            const delayInfo = exercice.dateLimit 
              ? calculateDelay(exercice.dateLimit, submission.dateSoumission)
              : null;
              
            return (
              <div 
                key={submission.id} 
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                {/* Barre de statut en haut */}
                <div className={`h-2 ${
                  submission.note 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : delayInfo?.late
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}></div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-medium">
                          {submission.eleveNom?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.eleveNom || "Élève inconnu"}</h3>
                        <p className="text-xs text-gray-500">ID: {submission.eleveId?.substring(0, 8) || "N/A"}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      submission.note 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {submission.note 
                        ? <CheckCircle className="w-3.5 h-3.5" /> 
                        : <Clock className="w-3.5 h-3.5" />}
                      <span>{submission.note ? 'Noté' : 'En attente'}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatDate(submission.dateSoumission)}</span>
                    </div>
                    
                    {delayInfo && (
                      <div className={`flex items-center gap-2 ${delayInfo.late ? 'text-amber-600' : 'text-green-600'}`}>
                        {delayInfo.late ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{delayInfo.text}</span>
                      </div>
                    )}
                  </div>
                  
                  {submission.note && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-green-800 font-medium">Note:</span>
                        <span className="text-lg font-bold text-green-700 bg-white px-3 py-1 rounded-lg">
                          {submission.note}/20
                        </span>
                      </div>
                      {submission.commentaire && (
                        <div className="mt-2">
                          <p className="text-xs text-green-800 font-medium mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Commentaire:
                          </p>
                          <p className="text-sm text-gray-700 bg-white p-2 rounded-lg">{submission.commentaire}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDownload(submission.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </button>
                    
                    <button
                      onClick={() => openNoteModal(submission)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        submission.note 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {submission.note ? (
                        <>
                          <Edit2 className="w-4 h-4" />
                          Modifier
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          Noter
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de notation */}
      {noteModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedSubmission.note ? 'Modifier la note' : 'Noter la soumission'}
              </h2>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {selectedSubmission.eleveNom?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedSubmission.eleveNom || "Élève inconnu"}</h3>
                    <p className="text-sm text-gray-500">{formatDate(selectedSubmission.dateSoumission)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedSubmission.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Télécharger</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmitNote}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (sur 20) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <span className="text-xl font-bold text-gray-700">/20</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="5"
                    placeholder="Appréciation, remarques, conseils..."
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciceSubmissions;