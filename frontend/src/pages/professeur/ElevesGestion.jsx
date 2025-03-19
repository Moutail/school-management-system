import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Search, 
  Mail, 
  Calendar, 
  GraduationCap,
  Phone,
  MapPin,
  Info,
  X,
  Download,
  Filter,
  ArrowUpDown,
  User,
  Clock,
  BarChart2,
  CheckCircle,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { getElevesForClasse, getProfesseurClasses } from '../../services/api';

// Composant Modal pour les détails
const DetailModal = ({ eleve, onClose, classes }) => {
  const classeActuelle = classes.find(c => c.id === eleve.classeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Détails de l&apos;élève</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
              <span className="text-3xl text-blue-700 font-bold">
                {eleve.nom.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-1">{eleve.nom}</h4>
              <div className="text-blue-600 font-medium flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>{classeActuelle?.nom || 'Classe non assignée'}</span>
              </div>
              <p className="text-gray-500 text-sm">ID: {eleve.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-xl space-y-4">
              <h5 className="font-medium text-gray-700 mb-3">Informations de contact</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{eleve.email}</p>
                  </div>
                </div>
                {eleve.telephone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-800">{eleve.telephone}</p>
                    </div>
                  </div>
                )}
                {eleve.adresse && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="font-medium text-gray-800">{eleve.adresse}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-xl space-y-4">
              <h5 className="font-medium text-gray-700 mb-3">Informations académiques</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date de naissance</p>
                    <p className="font-medium text-gray-800">{new Date(eleve.dateNaissance).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      eleve.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {eleve.status === 'actif' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{eleve.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {eleve.notes && eleve.notes.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h5 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                Notes récentes
              </h5>
              <div className="space-y-3">
                {eleve.notes.map((note, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{note.matiere}</p>
                      <p className="text-xs text-gray-500">{new Date(note.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-medium ${
                      note.valeur >= 15 ? 'bg-green-100 text-green-800' : 
                      note.valeur >= 10 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {note.valeur}/20
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter le profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DetailModal.propTypes = {
  eleve: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    dateNaissance: PropTypes.string.isRequired,
    telephone: PropTypes.string,
    adresse: PropTypes.string,
    classeId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    notes: PropTypes.arrayOf(PropTypes.shape({
      matiere: PropTypes.string.isRequired,
      valeur: PropTypes.number.isRequired,
      date: PropTypes.string
    }))
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  classes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired
  })).isRequired
};

// Composant principal
function ElevesGestion() {
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasse, setSelectedClasse] = useState(localStorage.getItem('classeId') || '');
  const [loading, setLoading] = useState(true);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [sortField, setSortField] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const classesData = await getProfesseurClasses();
        setClasses(classesData);

        if (selectedClasse) {
          const elevesData = await getElevesForClasse(selectedClasse);
          setEleves(elevesData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClasse]);

  const handleClasseChange = (classeId) => {
    setSelectedClasse(classeId);
    setSelectedEleve(null);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrer et trier les élèves
  const filteredEleves = eleves
    .filter(eleve => 
      (eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
       eleve.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'all' || eleve.status === filterStatus)
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'nom') {
        comparison = a.nom.localeCompare(b.nom);
      } else if (sortField === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortField === 'dateNaissance') {
        comparison = new Date(a.dateNaissance) - new Date(b.dateNaissance);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
      <ArrowUpDown className="w-4 h-4 text-blue-600 transform rotate-180" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-blue-600 font-medium">Chargement des élèves...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liste des Élèves</h1>
          <p className="text-gray-500 mt-1">Gérez et suivez les élèves de vos classes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedClasse}
              onChange={(e) => handleClasseChange(e.target.value)}
              className="pl-10 pr-10 py-2.5 w-full appearance-none border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-10 py-2.5 w-full appearance-none border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Total élèves</h3>
            <User className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-blue-600">{eleves.length}</p>
            <p className="text-sm text-gray-500">{classes.find(c => c.id === selectedClasse)?.nom || 'Toutes les classes'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Élèves actifs</h3>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-green-600">
              {eleves.filter(e => e.status === 'actif').length}
            </p>
            <p className="text-sm text-gray-500">{Math.round((eleves.filter(e => e.status === 'actif').length / eleves.length) * 100) || 0}% du total</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Activité récente</h3>
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-purple-600">
              {eleves.filter(e => new Date(e.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0}
            </p>
            <p className="text-sm text-gray-500">actifs cette semaine</p>
          </div>
        </div>
      </div>

      {/* Table des élèves */}
      <div className="bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50">
            <div className="grid grid-cols-12 divide-x divide-gray-100">
              <div 
                className="col-span-3 px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors flex items-center"
                onClick={() => handleSort('nom')}
              >
                <span className="mr-2">Nom</span>
                {getSortIcon('nom')}
              </div>
              <div 
                className="col-span-3 px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors flex items-center"
                onClick={() => handleSort('email')}
              >
                <span className="mr-2">Email</span>
                {getSortIcon('email')}
              </div>
              <div 
                className="col-span-2 px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors flex items-center"
                onClick={() => handleSort('dateNaissance')}
              >
                <span className="mr-2">Date de naissance</span>
                {getSortIcon('dateNaissance')}
              </div>
              <div className="col-span-2 px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</div>
              <div className="col-span-2 px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase">Actions</div>
            </div>
          </div>

          <div className="bg-white divide-y divide-gray-100">
            {filteredEleves.map((eleve) => (
              <div 
                key={eleve.id} 
                className="grid grid-cols-12 divide-x divide-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="col-span-3 px-6 py-4 flex items-center gap-3" onClick={() => setSelectedEleve(eleve)}>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-medium">
                      {eleve.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-gray-900 truncate">{eleve.nom}</p>
                    <p className="text-xs text-gray-500">ID: {eleve.id.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="col-span-3 px-6 py-4" onClick={() => setSelectedEleve(eleve)}>
                  <div className="flex items-center text-sm text-gray-600 truncate">
                    <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{eleve.email}</span>
                  </div>
                </div>
                <div className="col-span-2 px-6 py-4" onClick={() => setSelectedEleve(eleve)}>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{new Date(eleve.dateNaissance).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="col-span-2 px-6 py-4" onClick={() => setSelectedEleve(eleve)}>
                  <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full ${
                    eleve.status === 'actif'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${eleve.status === 'actif' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    {eleve.status}
                  </span>
                </div>
                <div className="col-span-2 px-6 py-4 flex justify-center items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEleve(eleve);
                    }}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
          
        {filteredEleves.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun élève trouvé</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {searchTerm 
                ? "Aucun élève ne correspond à votre recherche." 
                : selectedClasse 
                  ? "Aucun élève dans cette classe." 
                  : "Sélectionnez une classe pour voir ses élèves."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>

      {selectedEleve && (
        <DetailModal 
          eleve={selectedEleve} 
          onClose={() => setSelectedEleve(null)} 
          classes={classes}
        />
      )}
    </div>
  );
}

export default ElevesGestion;