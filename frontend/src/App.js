import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from './api';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import MyLeads from './pages/MyLeads';
import Dialer from './pages/Dialer';
import Users from './pages/Users';
import Settings from './pages/Settings';
import LeadDetails from './pages/LeadDetails';
import Layout from './components/Layout';

export default function App() {
  return (
    <HashRouter>
      <AuthenticatedApp />
    </HashRouter>
  );
}

function AuthenticatedApp() {
  const navigate = useNavigate();
  const [auth, setAuthState] = useState(getAuth());

  const login = (data) => {
    sessionStorage.setItem('auth', JSON.stringify(data));
    setAuthState(data);
    navigate('/');
  };

  const logout = () => {
    clearAuth();
    setAuthState(null);
  };

  return (
    <Routes>
        {!auth ? (
          <Route path="*" element={<Login onLogin={login} />} />
        ) : (
          <Route element={<Layout auth={auth} onLogout={logout} />}>
            <Route path="/" element={<Dashboard auth={auth} />} />
            <Route path="/leads" element={<Leads auth={auth} />} />
            <Route path="/myleads" element={<MyLeads auth={auth} />} />
            <Route path="/dialer" element={<Dialer auth={auth} />} />
            <Route path="/users" element={<Users auth={auth} />} />
            <Route path="/settings" element={<Settings auth={auth} />} />
            <Route path="/leads/:id" element={<LeadDetails auth={auth} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
    </Routes>
  );
}
