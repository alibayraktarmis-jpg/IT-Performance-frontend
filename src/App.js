import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kullanicilar from './pages/Kullanicilar';
import Kriterler from './pages/Kriterler';
import Degerlendirme from './pages/Degerlendirme';
import Raporlar from './pages/Raporlar';
import Hedefler from './pages/Hedefler';
import Gecmis from './pages/Gecmis';
import Profil from './pages/Profil';

function App() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/kullanicilar" element={!token ? <Navigate to="/login" /> : rol === 'Admin' ? <Kullanicilar /> : <Navigate to="/dashboard" />} />
        <Route path="/kriterler" element={!token ? <Navigate to="/login" /> : rol === 'Admin' ? <Kriterler /> : <Navigate to="/dashboard" />} />
        <Route path="/degerlendirme" element={!token ? <Navigate to="/login" /> : (rol === 'Admin' || rol === 'Evaluator') ? <Degerlendirme /> : <Navigate to="/dashboard" />} />
        <Route path="/raporlar" element={token ? <Raporlar /> : <Navigate to="/login" />} />
        <Route path="/hedefler" element={token ? <Hedefler /> : <Navigate to="/login" />} />
        <Route path="/gecmis" element={token ? <Gecmis /> : <Navigate to="/login" />} />
        <Route path="/profil" element={token ? <Profil /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;