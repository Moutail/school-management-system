// pages/admin/Settings.jsx
import { useState, useEffect } from 'react';
import { 
  Save, RefreshCw, Shield, School, 
  Database, AlertCircle 
} from 'lucide-react';

function Settings() {
  // Au début du composant, assurez-vous que toutes les propriétés ont des valeurs par défaut:
const [settings, setSettings] = useState({
  anneeScolaire: '',              // Valeur vide au lieu de undefined
  systemName: 'School Manager',
  backupEmail: '',
  maxUploadSize: 10,
  allowRegistration: true,
  maintenanceMode: false,
  notificationEmail: '',
  nomEcole: '',                   // Assurez-vous que cette propriété existe
  adresseEcole: '',
  contactEcole: '',
  logoEcole: null,
  montantScolarite: 0,            // Assurez-vous que cette propriété existe
  dateRentree: null,
  passwordPolicy: {
    minLength: 8,
    requireNumbers: true,
    requireSpecialChars: true,
    requireUppercase: true
  }
});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Dans votre component Settings.jsx, remplacez la fonction fetchSettings par:
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        try {
          // Essayer d'abord l'API
          const response = await fetch(`http://localhost:5000/api/admin/settings?userId=${userId}&userRole=${userRole}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.passwordPolicy) {
              setSettings(data);
              return;
            }
          }
          // Si on arrive ici, c'est que l'API a échoué ou retourné des données incomplètes
          throw new Error("Fallback aux valeurs par défaut");
        } catch (apiError) {
          console.warn("Erreur API, utilisation des valeurs par défaut:", apiError);
          
          // Utiliser des valeurs par défaut
          setSettings({
            anneeScolaire: new Date().getFullYear().toString(),
            montantScolarite: 0,
            dateRentree: null,
            nomEcole: "Mon École",
            adresseEcole: "",
            contactEcole: "",
            logoEcole: null,
            passwordPolicy: {
              minLength: 8,
              requireNumbers: true,
              requireSpecialChars: true,
              requireUppercase: true
            }
          });
        }
      } catch (error) {
        console.error('Erreur globale:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      const response = await fetch(`http://localhost:5000/api/admin/settings?userId=${userId}&userRole=${userRole}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
  
      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Paramètres sauvegardés avec succès'
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la sauvegarde des paramètres: ' + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setBackupInProgress(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/backup', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Sauvegarde effectuée avec succès'
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la sauvegarde'
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres du système</h1>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {message.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres généraux */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-500" />
            Paramètres généraux
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom du système
              </label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Année scolaire actuelle
              </label>
              <input
                type="text"
                value={settings.anneeScolaire}
                onChange={(e) => setSettings({...settings, anneeScolaire: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="2023-2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email de notification
              </label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({...settings, notificationEmail: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowRegistration"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="allowRegistration" className="ml-2 text-sm text-gray-700">
                Autoriser les inscriptions
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">
                Mode maintenance
              </label>
            </div>
          </form>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Paramètres de sécurité
          </h2>

          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Longueur minimale du mot de passe
            </label>
            <input
              type="number"
              value={settings.passwordPolicy?.minLength || 8} 
              onChange={(e) => setSettings({
                ...settings,
                passwordPolicy: {
                  ...(settings.passwordPolicy || {}),
                  minLength: parseInt(e.target.value)
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min="6"
            />
          </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireNumbers"
                  checked={settings.passwordPolicy.requireNumbers}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: {
                      ...settings.passwordPolicy,
                      requireNumbers: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="requireNumbers" className="ml-2 text-sm text-gray-700">
                  Exiger des chiffres
                </label>
              </div>

              <div className="flex items-center">
              <input
                type="checkbox"
                id="requireNumbers"
                checked={settings.passwordPolicy?.requireNumbers || false}  
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: {
                    ...(settings.passwordPolicy || {}),
                    requireNumbers: e.target.checked
                  }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="requireNumbers" className="ml-2 text-sm text-gray-700">
                Exiger des chiffres
              </label>
            </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireUppercase"
                  checked={settings.passwordPolicy.requireUppercase}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: {
                      ...settings.passwordPolicy,
                      requireUppercase: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="requireUppercase" className="ml-2 text-sm text-gray-700">
                  Exiger des majuscules
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sauvegarde */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Sauvegarde des données
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email de sauvegarde
              </label>
              <input
                type="email"
                value={settings.backupEmail}
                onChange={(e) => setSettings({...settings, backupEmail: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <button
              onClick={handleBackup}
              disabled={backupInProgress}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {backupInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Lancer une sauvegarde
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Settings;