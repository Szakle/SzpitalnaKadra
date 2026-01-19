import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';

import LoginPage from './pages/LoginPage';
import AddOsobaPage from './pages/AddOsobaPage';
import OsobaListPage from './pages/OsobaListPage';
import EditOsobaPage from './pages/EditOsobaPage';
import EditOsobaStep2Page from './pages/EditOsobaStep2Page';
import EditOsobaStep3Page from './pages/EditOsobaStep3Page';
import EditOsobaStep4Page from './pages/EditOsobaStep4Page';
import EditOsobaStep5Page from './pages/EditOsobaStep5Page';
import EditOsobaStep6Page from './pages/EditOsobaStep6Page';
import EditOsobaStep7Page from './pages/EditOsobaStep7Page';
import EditOsobaPodsumowaniePage from './pages/EditOsobaPodsumowaniePage';
import ZatrudnieniePage from './pages/ZatrudnieniePage';
import EditZatrudnieniePage from './pages/EditZatrudnieniePage';
import RozwiazZatrudnieniePage from './pages/RozwiazZatrudnieniePage';
import UsunZatrudnieniePage from './pages/UsunZatrudnieniePage';
import MiejscaPracyPage from './pages/MiejscaPracyPage';
import DodajMiejscePracyPage from './pages/DodajMiejscePracyPage';
import EdytujMiejscePracyPage from './pages/EdytujMiejscePracyPage';
import PodgladMiejscaPracyPage from './pages/PodgladMiejscaPracyPage';
import TwoFactorPage from './pages/TwoFactorPage';
import UsersManagementPage from './pages/UsersManagementPage';
import Navbar from './components/Navbar';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minut w milisekundach

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    if (sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
      return true;
    }
    localStorage.removeItem('sessionExpiry');
    return false;
  });

  const resetSessionTimer = useCallback(() => {
    const expiryTime = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem('sessionExpiry', expiryTime.toString());
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    resetSessionTimer();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('sessionExpiry');
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    // Resetuj timer przy kaĹĽdej aktywnoĹ›ci uĹĽytkownika
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetSessionTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Sprawdzaj co minutÄ™, czy sesja nie wygasĹ‚a
    const checkSession = setInterval(() => {
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      if (!sessionExpiry || Date.now() >= parseInt(sessionExpiry)) {
        alert('Sesja wygasĹ‚a. Zostaniesz wylogowany.');
        handleLogout();
      }
    }, 60000); // Sprawdzaj co minutÄ™

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(checkSession);
    };
  }, [isLoggedIn, resetSessionTimer]);

  return (
    <ToastProvider>
      <Router>
        {isLoggedIn && <Navbar onLogout={handleLogout} />}
        <Routes>
          {!isLoggedIn ? (
            <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
          ) : (
            <>
              <Route path="/" element={<Navigate to="/osoby" />} />
              <Route path="/dodaj-osobe" element={<AddOsobaPage />} />
              <Route path="/osoby" element={<OsobaListPage />} />
              <Route path="/edytuj-osobe/:id" element={<EditOsobaPage />} />
              <Route path="/edytuj-osobe-step2/:id" element={<EditOsobaStep2Page />} />
              <Route path="/edytuj-osobe-step3/:id" element={<EditOsobaStep3Page />} />
              <Route path="/edytuj-osobe-step4/:id" element={<EditOsobaStep4Page />} />
              <Route path="/edytuj-osobe-step5/:id" element={<EditOsobaStep5Page />} />
            <Route path="/edytuj-osobe-step6/:id" element={<EditOsobaStep6Page />} />
            <Route path="/edytuj-osobe-step7/:id" element={<EditOsobaStep7Page />} />
            <Route path="/edytuj-osobe-podsumowanie/:id" element={<EditOsobaPodsumowaniePage />} />
            <Route path="/zatrudnienie/:id" element={<ZatrudnieniePage />} />
            <Route path="/edytuj-zatrudnienie/:id" element={<EditZatrudnieniePage />} />
            <Route path="/rozwiaz-zatrudnienie/:id" element={<RozwiazZatrudnieniePage />} />
            <Route path="/usun-zatrudnienie/:id" element={<UsunZatrudnieniePage />} />
            <Route path="/miejsca-pracy/:id" element={<MiejscaPracyPage />} />
            <Route path="/dodaj-miejsce-pracy/:id" element={<DodajMiejscePracyPage />} />
            <Route path="/edytuj-miejsce-pracy/:id" element={<EdytujMiejscePracyPage />} />
            <Route path="/podglad-miejsce-pracy/:id" element={<PodgladMiejscaPracyPage />} />
            <Route path="/ustawienia-2fa" element={<TwoFactorPage />} />
            <Route path="/uzytkownicy" element={<UsersManagementPage />} />
            <Route path="/login" element={<Navigate to="/osoby" />} />
          </>
        )}
      </Routes>
    </Router>
    </ToastProvider>
  );
};

export default App;
