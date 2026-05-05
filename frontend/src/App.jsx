import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import VillageList from './components/VillageList';
import VillageDetails from './components/VillageDetails';
import FarmerDetails from './components/FarmerDetails';
import Analysis from './components/Analysis';
import AdvancedAnalysis from './components/AdvancedAnalysis';
import CashAnalysis from './components/CashAnalysis';
import Sections from './components/Sections';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VillageLoading from './components/VillageLoading';
import ActiveLoads from './components/ActiveLoads';

import Layout from './components/Layout';

/**
 * 🔒 ProtectedRoute Component
 * Prevents unauthorized access to private data.
 * Checks for a token in localStorage before rendering the component.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    let backButtonListener;
    const setupListener = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (window.location.pathname === '/' || window.location.pathname === '/login') {
          CapacitorApp.exitApp(); // Exit app if at root or login
        } else {
          navigate(-1); // Otherwise standard route back
        }
      });
    };
    setupListener();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate]);

  return (
    <Routes>
      {/* 🔓 Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* 🔒 Protected Private Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/records" 
        element={
          <ProtectedRoute>
            <VillageList />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/analysis" 
        element={
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/advanced-analysis" 
        element={
          <ProtectedRoute>
            <AdvancedAnalysis />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/all-sections" 
        element={
          <ProtectedRoute>
            <Sections />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/village-loading" 
        element={
          <ProtectedRoute>
            <VillageLoading />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/active-loads" 
        element={
          <ProtectedRoute>
            <ActiveLoads />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/cash-analysis" 
        element={
          <ProtectedRoute>
            <CashAnalysis />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/village/:villageName" 
        element={
          <ProtectedRoute>
            <VillageDetails />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/farmer/:id" 
        element={
          <ProtectedRoute>
            <FarmerDetails />
          </ProtectedRoute>
        } 
      />

      {/* 🔀 Fallback: Redirect unknown paths to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;