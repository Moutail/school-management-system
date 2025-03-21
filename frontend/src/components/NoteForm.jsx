import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ajouterNote, getNotesForClasse, updateNote, deleteNote } from '../services/api';
import { 
  Book, User, PenTool, MessageSquare, Check, AlertCircle,
  TrendingUp, Calendar, Search, Edit2, Trash2
} from 'lucide-react';

function NoteForm({ classeId, eleves, matieres, selectedMatiere, onMatiereChange }) {
  const [noteData, setNoteData] = useState({
    eleveId: '',
    note: '',
    commentaire: ''
  });
  const [existingNotes, setExistingNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [filterByNote, setFilterByNote] = useState('all');
  const [editingNoteId, setEditingNoteId] = useState(null);

  const matieresForClasse = matieres
    .find(groupe => groupe.classeId === classeId)?.matieres || [];

    // Dans NoteForm.jsx, modifiez useEffect pour mieux gérer les montages/démontages
useEffect(() => {
  let isMounted = true; // Drapeau pour vérifier si le composant est toujours monté
  
  const fetchNotes = async () => {
    if (!classeId || !selectedMatiere) {
      console.log('Classe ou matière non sélectionnée, pas de chargement de notes');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Tentative de récupération des notes pour:', { classeId, selectedMatiere });
      const notes = await getNotesForClasse(classeId, selectedMatiere);
      
      // Vérifier si le composant est toujours monté avant de mettre à jour l'état
      if (isMounted) {
        console.log('Notes récupérées avec succès:', notes);
        setExistingNotes(Array.isArray(notes) ? notes : []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      // Définir un tableau vide en cas d'erreur pour éviter les problèmes
      if (isMounted) {
        setExistingNotes([]);
        setLoading(false);
      }
    }
  };

  fetchNotes();
  
  // Fonction de nettoyage pour le démontage
  return () => {
    isMounted = false;
  };
}, [classeId, selectedMatiere]);

  const handleEdit = (note) => {
    setEditingNoteId(note.id);
    setNoteData({
      eleveId: note.eleveId,
      note: note.note.toString(),
      commentaire: note.commentaire || ''
    });
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    
    try {
      await deleteNote(noteId);
      const updatedNotes = await getNotesForClasse(classeId, selectedMatiere);
      setExistingNotes(updatedNotes);
      setSuccessMessage('Note supprimée avec succès!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
    }
  };

  const handleCancel = () => {
    setEditingNoteId(null);
    setNoteData({
      eleveId: '',
      note: '',
      commentaire: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedMatiere || !noteData.eleveId || !noteData.note) {
      console.log('Données incomplètes, impossible d\'ajouter la note');
      return;
    }

     // Désactiver le bouton pendant la soumission
     setLoading(true);

    const professeurId = localStorage.getItem('userId');
    if (!professeurId) {
      console.error('ID du professeur non disponible');
      return;
    }

    try {
      // Ajouter l'ID du professeur aux données de la note
      const noteWithProfesseur = {
        ...noteData,
        classeId,
        matiereId: selectedMatiere,
        professeurId, // Ajouter l'ID du professeur
        date: new Date().toISOString()
      };
      
      if (editingNoteId) {
        await updateNote(editingNoteId, noteWithProfesseur);
        setSuccessMessage('Note mise à jour avec succès!');
        setEditingNoteId(null);
      } else {
        // Vérifier si une note existe déjà pour cet élève dans cette matière
        const existingNote = existingNotes.find(
          note => note.eleveId === noteData.eleveId && note.matiereId === selectedMatiere
        );
    
        if (existingNote) {
          // Mettre à jour la note existante
          await updateNote(existingNote.id, noteWithProfesseur);
          setSuccessMessage('Note mise à jour avec succès!');
        } else {
          // Créer une nouvelle note
          await ajouterNote(noteWithProfesseur);
          setSuccessMessage('Note ajoutée avec succès!');
        }
      }
      
      // Rafraîchir la liste des notes
      const updatedNotes = await getNotesForClasse(classeId, selectedMatiere);
      setExistingNotes(updatedNotes);
      
      // Réinitialiser le formulaire
      setNoteData({
        eleveId: '',
        note: '',
        commentaire: ''
      });
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const getNoteForEleve = (eleveId) => {
    if (!existingNotes || !Array.isArray(existingNotes)) return null;
    return existingNotes.find(note => note && note.eleveId === eleveId);
  };

  const getMoyenneClasse = () => {
    if (!existingNotes || existingNotes.length === 0) return 0;
    
    // Filtre les notes valides (en cas de valeurs incorrectes dans les données)
    const validNotes = existingNotes.filter(note => 
      note && typeof note.note === 'number' || !isNaN(parseFloat(note.note))
    );
    
    if (validNotes.length === 0) return 0;
    
    const sum = validNotes.reduce((acc, note) => {
      const noteValue = typeof note.note === 'number' ? note.note : parseFloat(note.note);
      return acc + noteValue;
    }, 0);
    
    return (sum / validNotes.length).toFixed(2);
  };

  const getProgressionIndicator = (note) => {
    const moyenne = getMoyenneClasse();
    const diff = note - moyenne;
    if (diff > 2) return { color: 'text-green-500', text: '+' + diff.toFixed(1) };
    if (diff < -2) return { color: 'text-red-500', text: diff.toFixed(1) };
    return { color: 'text-yellow-500', text: '=' };
  };

  const filteredAndSortedEleves = () => {
    if (!eleves || !Array.isArray(eleves)) return [];
  
  return eleves
    .filter(eleve => {
      const note = getNoteForEleve(eleve.id);
      const matchesSearch = eleve.nom.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Vérifier que note est un objet valide avant d'accéder à note.note
      const noteValue = note ? parseFloat(note.note) : null;
      
      const matchesFilter = filterByNote === 'all' || 
        (filterByNote === 'success' && noteValue !== null && noteValue >= 15) ||
        (filterByNote === 'warning' && noteValue !== null && noteValue >= 10 && noteValue < 15) ||
        (filterByNote === 'danger' && noteValue !== null && noteValue < 10);
      
      return matchesSearch && matchesFilter;
    })
      .sort((a, b) => {
        const noteA = getNoteForEleve(a.id);
        const noteB = getNoteForEleve(b.id);
        
        switch(sortBy) {
          case 'note':
            return (noteB?.note || 0) - (noteA?.note || 0);
          case 'date':
            return new Date(noteB?.date || 0) - new Date(noteA?.date || 0);
          default:
            return a.nom.localeCompare(b.nom);
        }
      });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-2">Ajouter une note</h3>
          <p className="text-blue-100 text-sm">
            Sélectionnez un élève et entrez sa note
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Matière */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Book className="w-4 h-4" />
                Matière
              </label>
              <select
                value={selectedMatiere || ''}
                onChange={(e) => onMatiereChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Sélectionner une matière</option>
                {matieresForClasse.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Élève */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                Élève
              </label>
              <select
                value={noteData.eleveId}
                onChange={(e) => setNoteData(prev => ({ ...prev, eleveId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Sélectionner un élève</option>
                {eleves.map((eleve) => {
                  const existingNote = getNoteForEleve(eleve.id);
                  return (
                    <option key={eleve.id} value={eleve.id}>
                      {eleve.nom} {existingNote ? `(Note actuelle: ${existingNote.note}/20)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Note */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <PenTool className="w-4 h-4" />
                Note sur 20
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={noteData.note}
                onChange={(e) => setNoteData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Commentaire */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4" />
                Commentaire
              </label>
              <textarea
                value={noteData.commentaire}
                onChange={(e) => setNoteData(prev => ({ ...prev, commentaire: e.target.value }))}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ajoutez un commentaire (optionnel)"
              />
            </div>
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <Check className="w-5 h-5" />
              {successMessage}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-medium"
            >
              {editingNoteId ? 'Mettre à jour la note' : 'Ajouter la note'}
            </button>
            {editingNoteId && (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all font-medium"
              >
                Annuler la modification
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notes existantes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Notes de la classe</h3>
              {existingNotes.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-lg">
                    <span className="text-white text-sm font-medium">
                      Moyenne: {getMoyenneClasse()}/20
                    </span>
                  </div>
                  <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-lg">
                    <span className="text-white text-sm font-medium">
                      {existingNotes.length} notes
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white bg-opacity-10 text-white border-0 rounded-lg text-sm p-2"
              >
                <option value="nom">Trier par nom</option>
                <option value="note">Trier par note</option>
                <option value="date">Trier par date</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Barre de recherche et filtres */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <select
              value={filterByNote}
              onChange={(e) => setFilterByNote(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 text-sm"
            >
              <option value="all">Tous</option>
              <option value="success">≥ 15/20</option>
              <option value="warning">10-14/20</option>
              <option value="danger"> 10/20</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : eleves.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              Aucun élève dans cette classe
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedEleves().map((eleve) => {
                const existingNote = getNoteForEleve(eleve.id);
                const progression = existingNote ? getProgressionIndicator(existingNote.note) : null;

                return (
                  <div 
                    key={eleve.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors bg-white hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{eleve.nom}</h4>
                          {existingNote && (
                            <div className="mt-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => handleEdit(existingNote)}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDelete(existingNote.id)}
                                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Supprimer
                                  </button>
                                </div><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  existingNote.note >= 15 
                                    ? 'bg-green-100 text-green-800'
                                    : existingNote.note >= 10
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {existingNote.note}/20
                                </span>
                                {progression && (
                                  <span className={`flex items-center text-xs ${progression.color}`}>
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {progression.text}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(existingNote.date).toLocaleDateString()}
                                </span>
                              </div>
                              {existingNote.commentaire && (
                                <p className="text-sm text-gray-600 pl-1 border-l-2 border-gray-200">
                                  {existingNote.commentaire}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {!existingNote && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          Pas de note
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

NoteForm.propTypes = {
  classeId: PropTypes.string.isRequired,
  eleves: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  })).isRequired,
  matieres: PropTypes.arrayOf(
    PropTypes.shape({
      classeId: PropTypes.string.isRequired,
      classeName: PropTypes.string.isRequired,
      matieres: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          nom: PropTypes.string,
          professeurId: PropTypes.string
        })
      )
    })
  ),
  selectedMatiere: PropTypes.string,
  onMatiereChange: PropTypes.func.isRequired,
};

export default NoteForm;
