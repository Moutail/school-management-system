// src/App.jsx
// Ajoutez ceci aux imports en haut du fichier App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Pages publiques
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages Professeur
import ProfesseurDashboard from './pages/professeur/ProfesseurDashboard';
import CoursGestion from './pages/professeur/CoursGestion';
import ClassesGestion from './pages/professeur/ClassesGestion';
import ElevesGestion from './pages/professeur/ElevesGestion';

// Pages Élève
import EleveDashboard from './pages/eleve/EleveDashboard';
import CoursList from './pages/eleve/CoursList';
import NotesList from './pages/eleve/NotesList';
// Importation des nouveaux composants
import ParentDashboard from './pages/parent/ParentDashboard';
import FraisScolarite from './pages/parent/FraisScolarite';
import ParentNotes from './pages/parent/ParentNotes';
import ParentCours from './pages/parent/ParentCours';
import FraisScolariteGestion from './pages/admin/FraisScolariteGestion';

// Composants
import MatiereDetails from './components/MatiereDetails';
import NoteFormContainer from './components/NoteFormContainer';
import StudentGradesDashboard from './pages/professeur/StudentGradesDashboard';
//import StudentBulletin from './pages/professeur/StudentBulletin';
import BulletinWrapper from './pages/professeur/BulletinWrapper';
import BulletinEleve from './pages/eleve/BulletinEleve';
import ExercicesGestion from './pages/professeur/ExercicesGestion';
import ExercicesEleve from './pages/eleve/ExercicesEleve';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfesseursGestion from './pages/admin/ProfesseursGestion';
import Settings from './pages/admin/Settings';
import Messagerie from './components/Messagerie';
import ParentsGestion from './pages/admin/ParentsGestion';
import BulletinParent from './pages/parent/BulletinParent';
import AdminElevesGestion from './pages/admin/AdminElevesGestion';
import ClassesGestionAdmin from './pages/admin/ClassesGestionAdmin';
import AdminManagement from './pages/admin/AdminManagement';
import ExerciceSubmissions from './pages/professeur/ExerciceSubmissions';




// Guard de route authentifiée
const ProtectedRoute = ({ children, allowedRole }) => {
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = !!localStorage.getItem('userId');

  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si un rôle spécifique est requis et que l'utilisateur n'a pas ce rôle
  if (allowedRole && userRole !== allowedRole) {
    // Rediriger vers le tableau de bord correspondant au rôle de l'utilisateur
    const dashboardPath = 
      userRole === 'professeur' ? '/professeur' : 
      userRole === 'eleve' ? '/eleve' : 
      userRole === 'parent' ? '/parent' : 
      userRole === 'admin' ? '/admin' : '/login';
    
    return <Navigate to={dashboardPath} replace />;
  }

  // Si tout est en ordre, afficher le contenu
  return <DashboardLayout>{children}</DashboardLayout>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRole: PropTypes.string
};

// Guard de route publique
const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  if (isAuthenticated) {
    const dashboardPath = userRole === 'professeur' ? '/professeur' : '/eleve';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function App() {
  return (
    <AuthProvider> {/* Enveloppez votre Router avec AuthProvider */}
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />} 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messagerie />
                </ProtectedRoute>
              }
            />
            {/* Routes Admin */}
            <Route path="/admin">
              <Route 
                index
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="professeurs"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <ProfesseursGestion />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="classes"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <ClassesGestionAdmin />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/eleves"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminElevesGestion />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="settings"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route 
              path="frais-scolarite"
              element={
                <ProtectedRoute allowedRole="admin">
                  <FraisScolariteGestion />
                </ProtectedRoute>
              }
            />
            <Route 
              path="parents"
              element={
                <ProtectedRoute allowedRole="admin">
                  <ParentsGestion />
                </ProtectedRoute>
              }
            />
            <Route 
              path="administrateurs"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminManagement />
                </ProtectedRoute>
              }
            />
            </Route>

          {/* Routes Professeur */}
          <Route path="/professeur"> 
          <Route 
              path="exercices/soumissions/:exerciceId"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <ExerciceSubmissions />
                </ProtectedRoute>
              }
            />  
            <Route 
              index
              element={
                <ProtectedRoute allowedRole="professeur">
                  <ProfesseurDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="cours"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <CoursGestion />
                </ProtectedRoute>
              }
            />
            <Route 
              path="notes"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <StudentGradesDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="bulletin/:eleveId"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <BulletinWrapper />
                </ProtectedRoute>
              }
            />
            <Route 
              path="classes"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <ClassesGestion />
                </ProtectedRoute>
              }
            />
            <Route 
              path="eleves"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <ElevesGestion />
                </ProtectedRoute>
              }
            />
            <Route 
              path="exercices"
              element={
                <ProtectedRoute allowedRole="professeur">
                  <ExercicesGestion />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Routes Élève */}
          <Route path="/eleve">
            <Route 
              index
              element={
                <ProtectedRoute allowedRole="eleve">
                  <EleveDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="cours"
              element={
                <ProtectedRoute allowedRole="eleve">
                  <CoursList />
                </ProtectedRoute>
              }
            />
            <Route 
              path="notes"
              element={
                <ProtectedRoute allowedRole="eleve">
                  <NotesList />
                </ProtectedRoute>
              }
            />
            {/* Ajout de la route bulletin dans la section élève */}
            <Route 
              path="bulletin"
              element={
                <ProtectedRoute allowedRole="eleve">
                  <BulletinEleve />
                </ProtectedRoute>
              }
            />
            <Route 
            path="exercices"
            element={
              <ProtectedRoute allowedRole="eleve">
                <ExercicesEleve />
              </ProtectedRoute>
            }
          />
          </Route>

          {/* Routes Parent */}
          <Route path="/parent">
            <Route 
              index
              element={
                <ProtectedRoute allowedRole="parent">
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="eleve/:eleveId/notes"
              element={
                <ProtectedRoute allowedRole="parent">
                  <ParentNotes />
                </ProtectedRoute>
              }
            />
            <Route 
              path="eleve/:eleveId/cours"
              element={
                <ProtectedRoute allowedRole="parent">
                  <ParentCours />
                </ProtectedRoute>
              }
            />
            <Route 
              path="eleve/:eleveId/frais"
              element={
                <ProtectedRoute allowedRole="parent">
                  <FraisScolarite />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/parent/bulletin"
              element={
                <ProtectedRoute allowedRole="parent">
                  <BulletinParent />
                </ProtectedRoute>
              }
            />
            <Route 
              path="messages"
              element={
                <ProtectedRoute allowedRole="parent">
                  <Messagerie />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Routes communes */}
          <Route
            path="/matieres/:matiereId"
            element={
              <ProtectedRoute>
                <MatiereDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/add/:matiereId"
            element={
              <ProtectedRoute allowedRole="professeur">
                <NoteFormContainer />
              </ProtectedRoute>
            }
          />

          {/* Route 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;