// pages/admin/AdminManagement.jsx
import { useState, useEffect } from 'react';
import { UserPlus, RefreshCw, Edit, UserX, Lock } from 'lucide-react';
import AdminCreationForm from './AdminCreationForm';
import AdminEditForm from './AdminEditForm';
import { API_URL } from '../../config/api.config';
function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  useEffect(() => {
    fetchAdmins();
    checkIfPrimaryAdmin();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/admin?userId=${userId}&userRole=${userRole}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des administrateurs');
      }
      
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIfPrimaryAdmin = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/admin/check-primary?userId=${userId}&userRole=${userRole}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des droits');
      }
      
      const data = await response.json();
      setIsPrimaryAdmin(data.isPrimaryAdmin);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleAdminCreated = (newAdmin) => {
    setAdmins([...admins, newAdmin]);
    setShowCreateForm(false);
  };

  const handleAdminUpdated = (updatedAdmin) => {
    setAdmins(admins.map(admin => 
      admin.id === updatedAdmin.id ? updatedAdmin : admin
    ));
    setEditingAdmin(null);
  };

  const handleDeactivateAdmin = async (adminId) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet administrateur ?')) {
      return;
    }
    
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/admin/${adminId}/deactivate?userId=${userId}&userRole=${userRole}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la désactivation de l'administrateur");
      }
      
      // Mettre à jour l'état local
      setAdmins(admins.map(admin => 
        admin.id === adminId ? { ...admin, status: 'inactif' } : admin
      ));
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    }
  };

  const handleResetPassword = async (adminId) => {
    try {
      setResettingPassword(adminId);
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await fetch(`${API_URL}/admin/reset-password/admin/${adminId}?userId=${userId}&userRole=${userRole}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la réinitialisation du mot de passe");
      }
      
      const data = await response.json();
      setTempPassword({
        adminId,
        password: data.temporaryPassword
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setResettingPassword(null);
    }
  };

  if (loading && admins.length === 0) {
    return <div className="flex justify-center items-center h-64">Chargement des administrateurs...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des administrateurs</h1>
        
        {isPrimaryAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5" />
            Nouvel administrateur
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
      )}

      {tempPassword && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">Mot de passe temporaire généré</p>
              <p>Pour l&apos;administrateur: {admins.find(a => a.id === tempPassword.adminId)?.nom}</p>
              <p className="mt-2">
                <span className="font-semibold">Mot de passe: </span>
                <code className="bg-yellow-200 p-1 rounded">{tempPassword.password}</code>
              </p>
            </div>
            <button 
              onClick={() => setTempPassword(null)}
              className="text-yellow-800 hover:text-yellow-900"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map(admin => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{admin.nom}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{admin.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    admin.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.status === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {admin.id === '1' ? 'Principal' : 'Standard'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                                        {(isPrimaryAdmin || (admin.createdBy === localStorage.getItem('userId') && admin.id !== '1')) && (
                      <>
                        <button
                          onClick={() => setEditingAdmin(admin)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleResetPassword(admin.id)}
                          className="text-amber-600 hover:text-amber-800"
                          title="Réinitialiser le mot de passe"
                          disabled={resettingPassword === admin.id}
                        >
                          {resettingPassword === admin.id ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </button>
                        
                        {admin.id !== '1' && admin.status === 'actif' && (
                          <button
                            onClick={() => handleDeactivateAdmin(admin.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Désactiver"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateForm && (
        <AdminCreationForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleAdminCreated}
        />
      )}

      {editingAdmin && (
        <AdminEditForm
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={handleAdminUpdated}
        />
      )}
    </div>
  );
}

export default AdminManagement;
