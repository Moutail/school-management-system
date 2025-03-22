// pages/parent/FraisScolarite.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  DollarSign, AlertCircle, CheckCircle, 
  Clock, ArrowLeft, FileText, Calendar,
  Download, CreditCard, Info, ArrowRight
} from 'lucide-react';
import { API_URL } from '../../config/api.config';

function FraisScolarite() {
  const [frais, setFrais] = useState(null);
  const [eleve, setEleve] = useState(null);
  const [loading, setLoading] = useState(true);
  const { eleveId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les infos de l'élève
        const eleveRes = await fetch(`${API_URL}/eleves/${eleveId}`);
        const eleveData = await eleveRes.json();
        setEleve(eleveData);

        // Récupérer les frais de scolarité
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const fraisRes = await fetch(`${API_URL}/frais/eleve/${eleveId}/frais?userId=${userId}&userRole=${userRole}`);
        const fraisData = await fraisRes.json();
        setFrais(fraisData);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eleveId]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'payé': return 'text-green-600';
      case 'non payé': return 'text-red-600';
      case 'en attente': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'payé': return 'bg-green-100';
      case 'non payé': return 'bg-red-100';
      case 'en attente': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'payé': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'non payé': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'en attente': return <Clock className="w-5 h-5 text-orange-600" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-700">Chargement des données financières...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (!frais) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/parent" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-2 bg-white rounded-xl shadow-sm transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au tableau de bord</span>
          </Link>
          
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-800 mb-1">Information non disponible</h3>
                  <p className="text-orange-700">
                    Aucune information de frais de scolarité n&apos;est disponible pour cet élève.
                  </p>
                  <p className="text-orange-700 mt-2">
                    Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter le service administratif.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculer le pourcentage du paiement
  const percentage = Math.round((frais.montantPaye / frais.montantTotal) * 100);

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/parent" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-2 bg-white rounded-xl shadow-sm transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
        
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          {/* Bannière supérieure avec dégradé */}
          <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-blue-600" />
              Frais de scolarité - {eleve?.nom}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-blue-800">Montant total</h3>
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {frais.montantTotal.toLocaleString()} €
                </p>
                <p className="text-xs text-blue-700 mt-1">Frais annuels</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-green-800">Montant payé</h3>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {frais.montantPaye.toLocaleString()} €
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {frais.dernierPaiement ? `Dernier paiement: ${formatDate(frais.dernierPaiement)}` : 'Aucun paiement récent'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-amber-800">Reste à payer</h3>
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-900">
                  {(frais.montantTotal - frais.montantPaye).toLocaleString()} €
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {percentage === 100 ? 'Tout est payé!' : `${100 - percentage}% restant`}
                </p>
              </div>
            </div>
            
            {/* Barre de progression */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression des paiements</span>
                <span className="text-sm font-medium text-gray-700">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`${
                    percentage === 100 ? 'bg-green-500' : 
                    percentage >= 75 ? 'bg-emerald-500' : 
                    percentage >= 50 ? 'bg-blue-500' : 
                    percentage >= 25 ? 'bg-amber-500' : 
                    'bg-red-500'
                  } h-3 rounded-full transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 bg-gray-50 p-4 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Statut:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium ${
                    frais.statut === 'complet' ? 'bg-green-100 text-green-800' : 
                    frais.statut === 'partiel' ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {frais.statut === 'complet' && <CheckCircle className="w-4 h-4" />}
                    {frais.statut === 'partiel' && <Clock className="w-4 h-4" />}
                    {frais.statut === 'impayé' && <AlertCircle className="w-4 h-4" />}
                    {frais.statut === 'complet' ? 'Payé intégralement' : 
                     frais.statut === 'partiel' ? 'Partiellement payé' : 
                     'Non payé'}
                  </span>
                </div>
                {frais.dernierPaiement && (
                  <p className="text-sm text-gray-600 mt-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Dernier paiement: {formatDate(frais.dernierPaiement)}
                  </p>
                )}
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <CreditCard className="w-4 h-4" />
                <span>Effectuer un paiement</span>
              </button>
            </div>
            
            {/* Échéancier */}
            {frais.echeancier && frais.echeancier.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Échéancier de paiement
                </h3>
                <div className="overflow-x-auto bg-gray-50 rounded-xl p-2">
                  <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {frais.echeancier.map((echeance, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {formatDate(echeance.date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">
                              {echeance.montant.toLocaleString()} €
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${getStatusBg(echeance.statut)} ${getStatusColor(echeance.statut)}`}>
                              {getStatusIcon(echeance.statut)}
                              {echeance.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Informations de paiement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Modalités de paiement
            </h2>
            <p className="text-gray-600 mb-4">
              Les paiements doivent être effectués directement auprès du service comptable de l&apos;école. 
              Vous pouvez régler par chèque, espèces ou virement bancaire.
            </p>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors w-full justify-center">
              <Download className="w-4 h-4" />
              <span>Télécharger la facture</span>
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Coordonnées bancaires
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <div className="space-y-2 mb-3">
                <p className="text-sm text-blue-900 flex justify-between"><span className="font-medium">IBAN:</span> FR76 1234 5678 9123 4567 8912 345</p>
                <p className="text-sm text-blue-900 flex justify-between"><span className="font-medium">BIC:</span> ABCDEFGHIJK</p>
                <p className="text-sm text-blue-900 flex justify-between"><span className="font-medium">Titulaire:</span> École Nuage</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg mt-3">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Merci d&apos;indiquer le nom de l&apos;élève et sa classe en référence.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Besoin d'aide */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-md p-6 mt-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Besoin d&apos;aide?</h3>
              <p className="text-blue-100">
                Pour toute question concernant vos paiements, contactez notre service comptable.
              </p>
            </div>
            <div className="ml-auto">
              <button className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
                <span>Contacter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FraisScolarite;
