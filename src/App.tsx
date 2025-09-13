import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Collections } from './pages/Collections';
import { Write } from './pages/Write';
import { Library } from './pages/Library';
import { Enhanced } from './pages/Enhanced';
import { Videos } from './pages/Videos';
import { ChannelsPage } from './pages/ChannelsPage';
import SettingsPage from './pages/SettingsPage';
import HemingwayEditorPage from './pages/HemingwayEditorPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import './styles/globals.css';

// Placeholder components for missing routes
const BrandHub = () => <div>Brand Hub - Coming Soon</div>;
const Extensions = () => <div>Extensions - Coming Soon</div>;
const Mobile = () => <div>Mobile - Coming Soon</div>;

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes wrapped in Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/collections" element={
              <ProtectedRoute>
                <Layout>
                  <Collections />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/library" element={
              <ProtectedRoute>
                <Layout>
                  <Library />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/videos" element={
              <ProtectedRoute>
                <Layout>
                  <Videos />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/channels" element={
              <ProtectedRoute>
                <Layout>
                  <ChannelsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/write" element={
              <ProtectedRoute>
                <Layout>
                  <Write />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/brand-hub" element={
              <ProtectedRoute>
                <Layout>
                  <BrandHub />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/extensions" element={
              <ProtectedRoute>
                <Layout>
                  <Extensions />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/mobile" element={
              <ProtectedRoute>
                <Layout>
                  <Mobile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/enhanced" element={
              <ProtectedRoute>
                <Layout>
                  <Enhanced />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/editor" element={
              <ProtectedRoute>
                <Layout>
                  <HemingwayEditorPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route - redirect to dashboard (will trigger auth flow if not logged in) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;