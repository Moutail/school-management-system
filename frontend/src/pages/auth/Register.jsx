import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const Register = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'eleve',
    classeId: '',
    dateNaissance: '',
    matieres: [],
    telephone: '',
    elevesIds: []
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Charger la liste des classes et des élèves au chargement du composant
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || `${API_URL}/api`;
        const [classesRes, elevesRes] = await Promise.all([
          fetch(`${API_URL}/classes`),
          fetch(`${API_URL}/eleves`)
        ]);
                
        const classesData = await classesRes.json();
        setClasses(classesData);
        
        // Définir la première classe comme valeur par défaut si elle existe
        if (classesData.length > 0) {
          setFormData(prev => ({ ...prev, classeId: classesData[0].id }));
        }
        
        const elevesData = await elevesRes.json();
        setEleves(elevesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (formData.role === 'eleve') {
      if (!formData.dateNaissance) {
        newErrors.dateNaissance = 'La date de naissance est requise';
      }
      if (!formData.classeId) {
        newErrors.classeId = 'La classe est requise';
      }
    }
    
    if (formData.role === 'parent') {
      if (!formData.telephone) {
        newErrors.telephone = 'Le numéro de téléphone est requis';
      }
      if (formData.elevesIds.length === 0) {
        newErrors.elevesIds = 'Vous devez sélectionner au moins un enfant';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = {
        nom: formData.nom,
        email: formData.email,
        password: formData.password,
        status: 'actif',
      };
      
      // Ajouter les données spécifiques au rôle
      if (formData.role === 'eleve') {
        userData.classeId = formData.classeId;
        userData.dateNaissance = formData.dateNaissance;
      } else if (formData.role === 'professeur') {
        userData.matieres = formData.matieres;
      } else if (formData.role === 'parent') {
        userData.telephone = formData.telephone;
        userData.elevesIds = formData.elevesIds;
      }

      const response = await fetch(`${API_URL}/auth/register`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          role: formData.role
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'L\'inscription a échoué');
      }

      navigate('/login', {
        state: { message: 'Inscription réussie. Vous pouvez maintenant vous connecter.' }
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'select-multiple') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selectedOptions
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="bg-white p-3 rounded-full inline-block shadow-md mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">E</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-blue-800">Ecolenuage</h1>
          <p className="text-gray-600 mt-2">Créez votre compte pour accéder à votre espace éducatif</p>
        </div>

        <div className="bg-white shadow-xl border-2 border-blue-100 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-6">
            <h2 className="text-center text-white text-2xl font-bold">
              Inscription
            </h2>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Nom complet
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 ${
                      errors.nom ? 'border-red-300' : 'border-blue-100'
                    } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                    transition-all duration-200`}
                    placeholder="Nom complet"
                  />
                </div>
                {errors.nom && (
                  <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 ${
                      errors.email ? 'border-red-300' : 'border-blue-100'
                    } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                    transition-all duration-200`}
                    placeholder="votre@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Rôle */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Je suis
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl
                           focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                           transition-all duration-200 bg-white"
                >
                  <option value="eleve">👨‍🎓 Élève</option>
                  <option value="professeur">👨‍🏫 Professeur</option>
                  <option value="parent">👨‍👩‍👧‍👦 Parent</option>
                </select>
              </div>
              
              {/* Sélection de la classe pour les élèves */}
              {formData.role === 'eleve' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Classe
                  </label>
                  <select
                    name="classeId"
                    value={formData.classeId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.classeId ? 'border-red-300' : 'border-blue-100'
                    } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                    transition-all duration-200 bg-white`}
                  >
                    <option value="">Sélectionnez une classe</option>
                    {classes.map(classe => (
                      <option key={classe.id} value={classe.id}>
                        {classe.nom} - {classe.niveau} ({classe.anneeScolaire})
                      </option>
                    ))}
                  </select>
                  {errors.classeId && (
                    <p className="text-red-500 text-xs mt-1">{errors.classeId}</p>
                  )}
                </div>
              )}
 
              {/* Date de naissance (uniquement pour les élèves) */}
              {formData.role === 'eleve' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.dateNaissance ? 'border-red-300' : 'border-blue-100'
                    } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                    transition-all duration-200`}
                  />
                  {errors.dateNaissance && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateNaissance}</p>
                  )}
                </div>
              )}
              
              {/* Téléphone (uniquement pour les parents) */}
              {formData.role === 'parent' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Numéro de téléphone
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 ${
                        errors.telephone ? 'border-red-300' : 'border-blue-100'
                      } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                      transition-all duration-200`}
                      placeholder="Votre numéro de téléphone"
                    />
                  </div>
                  {errors.telephone && (
                    <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>
                  )}
                </div>
              )}
              
              {/* Sélection des enfants (uniquement pour les parents) */}
              {formData.role === 'parent' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Sélectionnez vos enfants
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserPlus className="h-5 w-5 text-blue-500" />
                    </div>
                    <select
                      name="elevesIds"
                      multiple
                      value={formData.elevesIds}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 ${
                        errors.elevesIds ? 'border-red-300' : 'border-blue-100'
                      } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                      transition-all duration-200`}
                      size={Math.min(5, eleves.length)}
                    >
                      {eleves.map(eleve => (
                        <option key={eleve.id} value={eleve.id}>
                          {eleve.nom} - {classes.find(c => c.id === eleve.classeId)?.nom || 'Classe inconnue'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs enfants
                  </p>
                  {errors.elevesIds && (
                    <p className="text-red-500 text-xs mt-1">{errors.elevesIds}</p>
                  )}
                </div>
              )}

              {/* Mots de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 ${
                        errors.password ? 'border-red-300' : 'border-blue-100'
                      } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                      transition-all duration-200`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-blue-100'
                      } rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                      transition-all duration-200`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Message d'erreur général */}
              {errors.submit && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {errors.submit}
                </div>
              )}

              {/* Bouton d'inscription */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl
                         transform hover:scale-[1.02] transition-all duration-200
                         font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Inscription en cours...
                  </div>
                ) : (
                  "Créer mon compte"
                )}
              </button>

              {/* Lien de connexion */}
              <p className="text-center text-sm text-gray-600 mt-6">
                Déjà inscrit ?{' '}
                <a 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline
                           transition-colors duration-200"
                >
                  Se connecter
                </a>
              </p>
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
};

export default Register;
