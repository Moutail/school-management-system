import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  LogOut,
  ListChecks,
  ScrollText,
  Settings,
  Mail,
  DollarSign,
  Cloud
} from 'lucide-react';
import { getUnreadMessagesCount } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);

  // Define messageItem before using it in menu items
  const messageItem = {
    title: 'Messages',
    path: '/messages',
    icon: Mail,
    description: 'Messagerie'
  };

  const auth = useAuth();
  const handleLogout = () => {
    // Vérifiez si auth et logout existent
    if (auth && auth.logout) {
      auth.logout();
    } else {
      // Solution de secours si useAuth n'est pas disponible
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login?t=' + new Date().getTime();
    }
  };

  useEffect(() => {
    const checkIfPrimaryAdmin = async () => {
      if (userRole !== 'admin') return;
      
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(
          `http://localhost:5000/api/admin/check-primary?userId=${userId}&userRole=${userRole}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setIsPrimaryAdmin(data.isPrimaryAdmin);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des privilèges:', error);
      }
    };
    
    checkIfPrimaryAdmin();
  }, [userRole]);

  // Effect to fetch unread messages count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const data = await getUnreadMessagesCount();
        setUnreadMessages(data.count);
        
      } catch (error) {
        console.error('Error fetching unread messages:', error);
        setUnreadMessages(0);
      }
    };
  
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 60000);
    return () => clearInterval(interval);
  }, []);

  const professeurMenuItems = [
    {
      title: 'Dashboard',
      path: '/professeur',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble'
    },
    {
      title: 'Gestion des Cours',
      path: '/professeur/cours',
      icon: BookOpen,
      description: 'Gérer vos cours'
    },
    {
      title: 'Mes Classes',
      path: '/professeur/classes',
      icon: GraduationCap,
      description: 'Gestion des classes'
    },
    {
      title: 'Gestion des Notes',
      path: '/professeur/notes',
      icon: ScrollText,
      description: 'Noter les élèves'
    },
    {
      title: 'Suivi des Élèves',
      path: '/professeur/eleves',
      icon: Users,
      description: 'Voir les progrès'
    },
    {
      title: 'Exercices',
      path: '/professeur/exercices',
      icon: BookOpen,
      description: 'Gérer les exercices'
    },
    messageItem
  ];

  const adminMenuItems = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble'
    },
     // Ajouter ce nouvel élément pour la gestion des administrateurs
     ...(isPrimaryAdmin ? [{
      title: 'Gestion des Administrateurs',
      path: '/admin/administrateurs',
      icon: Users,
      description: 'Gérer les administrateurs'
    }] : []),
    {
      title: 'Gestion des Professeurs',
      path: '/admin/professeurs',
      icon: Users,
      description: 'Gérer les professeurs'
    },
    {
      title: 'Gestion des Classes',
      path: '/admin/classes',
      icon: GraduationCap,
      description: 'Gérer les classes'
    },
    {
      title: 'Gestion des Élèves',
      path: '/admin/eleves',
      icon: Users,
      description: 'Gérer les élèves'
    },
    {
      title: 'Frais de Scolarité',
      path: '/admin/frais-scolarite',
      icon: DollarSign,
      description: 'Suivi des paiements'
    },
    {
      title: 'Configuration',
      path: '/admin/settings',
      icon: Settings,
      description: 'Paramètres système'
    },
    {
      title: 'Gestion des Parents',
      path: '/admin/parents',
      icon: Users,
      description: 'Gérer les parents'
    },
    messageItem
  ];

  const eleveMenuItems = [
    {
      title: 'Dashboard',
      path: '/eleve',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble'
    },
    {
      title: 'Mes Cours',
      path: '/eleve/cours',
      icon: BookOpen,
      description: 'Accéder aux cours'
    },
    {
      title: 'Mes Notes',
      path: '/eleve/notes',
      icon: ListChecks,
      description: 'Consulter vos notes'
    },
    {
      title: 'Bulletin',
      path: '/eleve/bulletin',
      icon: ScrollText,
      description: 'Voir votre bulletin'
    },
    {
      title: 'Exercices',
      path: '/eleve/exercices',
      icon: BookOpen,
      description: 'Mes exercices'
    },
    messageItem
  ];

  // Nouveau menu pour les parents
  const parentMenuItems = [
    {
      title: 'Dashboard',
      path: '/parent',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble'
    },
    messageItem
  ];

  const menuItems = {
    admin: adminMenuItems,
    professeur: professeurMenuItems,
    eleve: eleveMenuItems,
    parent: parentMenuItems
  }[userRole] || [];

  const isActiveLink = (path) => {
    if (path === '/professeur' || path === '/eleve' || path === '/parent' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile menu button - redesigned with soft shadow and animation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transform transition-all duration-200 hover:scale-105"
        aria-label="Menu"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar container with smoother shadow and transition */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo header with cloud gradient background */}
          <div className="flex items-center justify-center h-20 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center space-x-2">
              <Cloud className="w-8 h-8 text-white" />
              <h1 className="text-xl font-bold text-white">École Nuage</h1>
            </div>
          </div>

          {/* Profile section with subtle background */}
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                {userRole === 'eleve' ? 'E' : userRole === 'professeur' ? 'P' : userRole === 'admin' ? 'A' : 'U'}
              </div>
              <div>
                <div className="font-medium text-gray-900 capitalize">
                  {userRole || 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">
                  {userRole === 'eleve' ? 'Espace étudiant' : 
                   userRole === 'professeur' ? 'Espace enseignant' : 
                   userRole === 'admin' ? 'Administration' : 'Portail'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation menu with improved spacing and hover effects */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActiveLink(item.path)
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                  isActiveLink(item.path) ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'
                }`} />
                <div className="flex-1">
                  <span className={`font-medium ${isActiveLink(item.path) ? 'text-blue-600' : ''}`}>
                    {item.title}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                {item.path === '/messages' && unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout button with improved styling */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
            >
              <LogOut className="w-5 h-5 mr-3 text-gray-500 group-hover:text-red-500" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile - improved with blur effect */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}