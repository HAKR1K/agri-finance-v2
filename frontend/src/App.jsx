import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import VillageList from './components/VillageList';
import VillageDetails from './components/VillageDetails';
import FarmerDetails from './components/FarmerDetails';
import Analysis from './components/Analysis';

// 👇 1. IMPORT THE NEW COMPONENTS
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 👇 2. ADD THE FORGOT PASSWORD ROUTES */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Dashboard is the new Home */}
      <Route path="/" element={<Dashboard />} />
      
      {/* New Modules */}
      <Route path="/records" element={<VillageList />} />
      <Route path="/analysis" element={<Analysis />} />
      
      {/* Details Pages */}
      <Route path="/village/:villageName" element={<VillageDetails />} />
      <Route path="/farmer/:id" element={<FarmerDetails />} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;