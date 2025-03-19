// Dans src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les infos utilisateur du localStorage
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const classeId = localStorage.getItem('classeId');
    
    if (userId && userRole) {
      setUser({ id: userId, role: userRole, name: userName, classeId });
    }
    
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Stocker dans le state et le localStorage
    setUser(userData);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userName', userData.nom);
    if (userData.classeId) {
      localStorage.setItem('classeId', userData.classeId);
    }
  };

  const logout = () => {
    // Nettoyer le state et le localStorage
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    // Rediriger vers la page de connexion
    window.location.href = '/login?t=' + new Date().getTime();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);