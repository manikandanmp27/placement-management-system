import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';

import { useAuth } from './contexts/AuthContext';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import CompaniesPage from './pages/CompaniesPage';
import JobsPage from './pages/JobsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import InterviewsPage from './pages/InterviewsPage';
import PlacementsPage from './pages/PlacementsPage';
import StatisticsPage from './pages/StatisticsPage';

import StudentApplicationsPage from './pages/StudentApplicationsPage';
import StudentInterviewsPage from './pages/StudentInterviewsPage';
import StudentPlacementPage from './pages/StudentPlacementPage';
import StudentProfilePage from './pages/StudentProfilePage';

function ApplicationsRoute() {
  const { isStudent } = useAuth();
  return isStudent ? <Navigate to="/my-applications" replace /> : <ApplicationsPage />;
}

function InterviewsRoute() {
  const { isStudent } = useAuth();
  return isStudent ? <Navigate to="/my-interviews" replace /> : <InterviewsPage />;
}

function PlacementsRoute() {
  const { isStudent } = useAuth();
  return isStudent ? <Navigate to="/my-placement" replace /> : <PlacementsPage />;
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route
                  path="students"
                  element={
                    <ProtectedRoute allowedRoles={['ROLE_PLACEMENT_OFFICER', 'ROLE_ADMIN']}>
                      <StudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="jobs" element={<JobsPage />} />

                {/* Role-adaptive / dedicated routes */}
                <Route path="applications" element={<ApplicationsRoute />} />
                <Route path="interviews" element={<InterviewsRoute />} />
                <Route path="placements" element={<PlacementsRoute />} />
                <Route path="statistics" element={<StatisticsPage />} />

                {/* Student Portal Dedicated Views */}
                <Route
                  path="my-applications"
                  element={
                    <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                      <StudentApplicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-interviews"
                  element={
                    <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                      <StudentInterviewsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-placement"
                  element={
                    <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                      <StudentPlacementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-profile"
                  element={
                    <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                      <StudentProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

