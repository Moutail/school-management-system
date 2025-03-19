import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, UserSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'eleve' // Valeur par défaut
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userName', data.nom);
        localStorage.setItem('token', data.token);
        if (data.classeId) {
          localStorage.setItem('classeId', data.classeId);
        }
        
        switch (data.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'professeur':
            navigate('/professeur');
            break;
          case 'eleve':
            navigate('/eleve');
            break;
          case 'parent':
            navigate('/parent');
            break;
          default:
            setError('Rôle non reconnu');
        }
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="bg-white p-3 rounded-full inline-block shadow-md mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">E</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-blue-800">Ecolenuage</h1>
          <p className="text-gray-600 mt-2">Votre espace éducatif numérique</p>
        </div>

        <div className="bg-white shadow-xl border-2 border-blue-100 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-6">
            <h2 className="text-center text-white text-2xl font-bold">
              Connexion à votre espace
            </h2>
          </div>

          <div className="p-8">
            {/* Message de succès après inscription */}
            {successMessage && (
              <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {successMessage}
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Rôle */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Rôle</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <select
                    name="role"
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="eleve">👨‍🎓 Élève</option>
                    <option value="professeur">👨‍🏫 Professeur</option>
                    <option value="parent">👨‍👩‍👧‍👦 Parent</option>
                    <option value="admin">⚙️ Administrateur</option>
                  </select>
                </div>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transform hover:scale-[1.02] transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Connexion en cours...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </button>

              {/* Lien d'inscription */}
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200"
                  >
                    S&apos;inscrire
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2024 Ecolenuage - Tous droits réservés
        </div>
      </div>
    </div>
  );
}

export default Login;
