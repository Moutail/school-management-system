// pages/admin/FraisScolariteGestion.jsx
import { useState, useEffect } from 'react';
import { 
  Search, DollarSign, CheckCircle, 
  AlertCircle, Clock, Save
} from 'lucide-react';
import { updateFraisEleve } from '../../services/api'; 
import { API_URL } from '../../config/api.config';

function FraisScolariteGestion() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [paiementForm, setPaiementForm] = useState({
    montant: '',
    commentaire: '',
    dateEcheance: '',
    nouveauTotal: ''
  });

  // Ajoutez cette fonction après le premier useEffect
useEffect(() => {
    // Si nous avons des élèves mais pas de frais de scolarité, chargez-les explicitement
    const loadFraisForEleves = async () => {
      if (eleves.length > 0) {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        console.log("Préchargement des frais pour les élèves...");
        
        // Créer des promesses pour chaque élève
        const promises = eleves.map(async (eleve) => {
          try {
            const response = await fetch(`${API_URL}/frais/eleve/${eleve.id}/frais?userId=${userId}&userRole=${userRole}`);
            
            if (response.ok) {
              const fraisData = await response.json();
              console.log(`Frais chargés pour ${eleve.nom}:`, fraisData);
              
              // Mettre à jour l'élève avec les frais
              return {
                ...eleve,
                fraisScolarite: {
                  montantTotal: fraisData.montantTotal || 0,
                  montantPaye: fraisData.montantPaye || 0,
                  statut: fraisData.statut || 'Non défini'
                }
              };
            }
            return eleve;
          } catch (error) {
            console.error(`Erreur lors du chargement des frais pour ${eleve.nom}:`, error);
            return eleve;
          }
        });
        
        // Attendre toutes les promesses et mettre à jour les élèves
        const updatedEleves = await Promise.all(promises);
        setEleves(updatedEleves);
      }
    };
    
    loadFraisForEleves();
  }, [eleves.length]); // Dépendance au nombre d'élèves uniquement

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        const [elevesRes, classesRes] = await Promise.all([
          fetch(`${API_URL}/eleves?userId=${userId}&userRole=${userRole}`),
          fetch(`${API_URL}/classes?userId=${userId}&userRole=${userRole}`)
        ]);
  
        if (!elevesRes.ok || !classesRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }
  
        const elevesData = await elevesRes.json();
        const classesData = await classesRes.json();
  
        // Transformation des données pour s'assurer qu'elles ont la bonne structure
        const elevesFormatted = elevesData.map(eleve => {
          // S'assurer que fraisScolarite existe avec les bonnes propriétés
          if (!eleve.fraisScolarite) {
            eleve.fraisScolarite = {
              montantTotal: 0,
              montantPaye: 0,
              statut: 'Non défini'
            };
          } else {
            // Convertir explicitement en nombres si ce n'est pas déjà le cas
            eleve.fraisScolarite.montantTotal = Number(eleve.fraisScolarite.montantTotal || 0);
            eleve.fraisScolarite.montantPaye = Number(eleve.fraisScolarite.montantPaye || 0);
            // S'assurer que le statut existe
            if (!eleve.fraisScolarite.statut) {
              eleve.fraisScolarite.statut = 'Non défini';
            }
          }
          return eleve;
        });
  
        console.log("Élèves formatés:", elevesFormatted);
        setEleves(elevesFormatted);
        setClasses(classesData);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [refreshTrigger]);

  useEffect(() => {
    console.log("Élèves chargés:", eleves);
    // Vérifier spécifiquement les frais de scolarité
    eleves.forEach(eleve => {
      console.log(`Élève ${eleve.id} - ${eleve.nom}:`, eleve.fraisScolarite);
    });
  }, [eleves]);
  
  const handleUpdatePaiement = async (e) => {
    e.preventDefault();
    
    try {
      // Créer un objet de mise à jour complet
      const updateData = {};
      
      // Ajouter le montant payé seulement s'il est renseigné
      if (paiementForm.montant) {
        updateData.montantPaye = Number(paiementForm.montant);
      }
      
      // Ajouter le montant total seulement s'il est renseigné
      if (paiementForm.nouveauTotal) {
        updateData.nouveauTotal = Number(paiementForm.nouveauTotal);
      }
      
      // Ajouter le commentaire s'il est renseigné
      if (paiementForm.commentaire) {
        updateData.commentaire = paiementForm.commentaire;
      }
      
      console.log('Envoi des données:', updateData);
      
      // Utiliser le service API au lieu de fetch directement
      const fraisData = await updateFraisEleve(selectedEleve.id, updateData);
      
      console.log('Données reçues du serveur:', fraisData);
      
      // Mise à jour immédiate des données locales
      setEleves(prevEleves => {
        return prevEleves.map(eleve => {
          if (eleve.id === selectedEleve.id) {
            return {
              ...eleve,
              fraisScolarite: {
                montantTotal: fraisData.montantTotal || eleve.fraisScolarite?.montantTotal || 0,
                montantPaye: fraisData.montantPaye || eleve.fraisScolarite?.montantPaye || 0,
                statut: fraisData.statut || 'Non défini'
              }
            };
          }
          return eleve;
        });
      });
      
      // Fermer le modal et réinitialiser le formulaire
      setShowModal(false);
      setPaiementForm({
        montant: '',
        commentaire: '',
        dateEcheance: '',
        nouveauTotal: ''
      });
      
      // Déclencher un rafraîchissement des données APRÈS la fermeture du modal
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 100);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };
  const getStatusColor = (status) => {
    switch(status) {
      case 'complet': return 'bg-green-100 text-green-800';
      case 'partiel': return 'bg-orange-100 text-orange-800';
      case 'impayé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch = eleve.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClasse = !selectedClasse || eleve.classeId === selectedClasse;
    return matchesSearch && matchesClasse;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des frais de scolarité</h1>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="border rounded-lg px-4 py-2 md:w-48"
          >
            <option value="">Toutes les classes</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id}>{classe.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des élèves */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant payé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEleves.map(eleve => (
              <tr key={eleve.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{eleve.nom[0]}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{eleve.nom}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {classes.find(c => c.id === eleve.classeId)?.nom || 'Non assigné'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                    {typeof eleve.fraisScolarite?.montantTotal === 'number' 
                    ? `${eleve.fraisScolarite.montantTotal.toLocaleString()} €`
                    : "0 €"}
                </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                    {typeof eleve.fraisScolarite?.montantPaye === 'number' 
                    ? `${eleve.fraisScolarite.montantPaye.toLocaleString()} €`
                    : "0 €"}
                </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                {eleve.fraisScolarite?.statut ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(eleve.fraisScolarite.statut)}`}>
                    {eleve.fraisScolarite.statut === 'complet' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {eleve.fraisScolarite.statut === 'partiel' && <Clock className="w-3 h-3 mr-1" />}
                    {eleve.fraisScolarite.statut === 'impayé' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {eleve.fraisScolarite.statut}
                    </span>
                ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    Non défini
                    </span>
                )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedEleve(eleve);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <DollarSign className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/modification de paiement */}
      {showModal && selectedEleve && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Mise à jour des frais pour {selectedEleve.nom}
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Montant total actuel:</p>
                  <p className="font-semibold">{selectedEleve.fraisScolarite?.montantTotal?.toLocaleString() || 0} €</p>
                </div>
                <div>
                  <p className="text-gray-600">Montant déjà payé:</p>
                  <p className="font-semibold">{selectedEleve.fraisScolarite?.montantPaye?.toLocaleString() || 0} €</p>
                </div>
                <div>
                  <p className="text-gray-600">Restant à payer:</p>
                  <p className="font-semibold">
                    {((selectedEleve.fraisScolarite?.montantTotal || 0) - 
                     (selectedEleve.fraisScolarite?.montantPaye || 0)).toLocaleString()} €
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Statut actuel:</p>
                  <p className="font-semibold">{selectedEleve.fraisScolarite?.statut || 'Non défini'}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleUpdatePaiement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nouveau paiement (€)
                </label>
                <input
                  type="number"
                  value={paiementForm.montant}
                  onChange={(e) => setPaiementForm({...paiementForm, montant: e.target.value})}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Montant payé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mettre à jour le montant total (optionnel)
                </label>
                <input
                  type="number"
                  value={paiementForm.nouveauTotal}
                  onChange={(e) => setPaiementForm({...paiementForm, nouveauTotal: e.target.value})}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Nouveau montant total"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Commentaire
                </label>
                <textarea
                  value={paiementForm.commentaire}
                  onChange={(e) => setPaiementForm({...paiementForm, commentaire: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows="3"
                  placeholder="Informations supplémentaires"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPaiementForm({
                      montant: '',
                      commentaire: '',
                      dateEcheance: '',
                      nouveauTotal: ''
                    });
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FraisScolariteGestion;
