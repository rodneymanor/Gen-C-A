import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Collections } from './pages/Collections';
import { Write } from './pages/Write';
import { Library } from './pages/Library';
import './styles/globals.css';
import type { User } from './types';

// Placeholder components for missing routes
const BrandHub = () => <div>Brand Hub - Coming Soon</div>;
const Extensions = () => <div>Extensions - Coming Soon</div>;
const Mobile = () => <div>Mobile - Coming Soon</div>;
const Settings = () => <div>Settings - Coming Soon</div>;

// Mock user data - in a real app this would come from authentication context
const mockUser: User = {
  id: '1',
  name: 'Sarah Chen',
  email: 'sarah@example.com',
  avatar: '',
  role: 'creator',
  plan: 'premium',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      inApp: true,
      frequency: 'immediate'
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',
      screenReaderOptimized: false
    }
  }
};



function App() {
  return (
    <>
      <Router>
        <Layout user={mockUser}>
          <Routes>
            {/* Main routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/library" element={<Library />} />
            <Route path="/write" element={<Write />} />
            <Route path="/brand-hub" element={<BrandHub />} />
            <Route path="/extensions" element={<Extensions />} />
            <Route path="/mobile" element={<Mobile />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route - 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;