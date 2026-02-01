import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Toaster } from 'react-hot-toast';
import LoginNew from './pages/LoginNew.jsx';
import DashboardNew from './pages/DashboardNew.jsx';
import CreateSessionNew from './pages/CreateSessionNew.jsx';
import LiveMonitoringNew from './pages/LiveMonitoringNew.jsx';
import LiveMonitoringOverview from './pages/LiveMonitoringOverview.jsx';
import AttendanceReport from './pages/AttendanceReport.jsx';
import AttendanceReportOverview from './pages/AttendanceReportOverview.jsx';
import AISummary from './pages/AISummary.jsx';
import AISummaryOverview from './pages/AISummaryOverview.jsx';
import ExamReport from './pages/ExamReport.jsx';
import ExamMonitoringOverview from './pages/ExamMonitoringOverview.jsx';
import ParticipantDetail from './pages/ParticipantDetail.jsx';
import Settings from './pages/Settings.jsx';
import SessionHistory from './pages/SessionHistory.jsx';
import Loader from './components/common/Loader.jsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                },
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginNew />
                  </PublicRoute>
                }
              />

              {/* Protected Routes - No Layout wrapper, pages have Sidebar/TopBar */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-session"
                element={
                  <ProtectedRoute>
                    <CreateSessionNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/live-monitoring"
                element={
                  <ProtectedRoute>
                    <LiveMonitoringOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions/:id"
                element={
                  <ProtectedRoute>
                    <LiveMonitoringNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance-report"
                element={
                  <ProtectedRoute>
                    <AttendanceReportOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions/:id/attendance"
                element={
                  <ProtectedRoute>
                    <AttendanceReport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-summary"
                element={
                  <ProtectedRoute>
                    <AISummaryOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions/:id/ai-summary"
                element={
                  <ProtectedRoute>
                    <AISummary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam-monitoring"
                element={
                  <ProtectedRoute>
                    <ExamMonitoringOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participants/:id"
                element={
                  <ProtectedRoute>
                    <ParticipantDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions/:id/exam-report"
                element={
                  <ProtectedRoute>
                    <ExamReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <SessionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
