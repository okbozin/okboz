import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { EmployeeApp } from './components/EmployeeApp';

const App: React.FC = () => {
  // view: 'landing' | 'admin' | 'employee'
  const [view, setView] = useState<'landing' | 'admin' | 'employee'>('landing');

  const handleAdminLogin = () => {
    setView('admin');
    window.scrollTo(0, 0);
  };

  const handleEmployeeLogin = () => {
    setView('employee');
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setView('landing');
    window.scrollTo(0, 0);
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPage 
          onAdminLogin={handleAdminLogin} 
          onEmployeeLogin={handleEmployeeLogin} 
        />
      )}
      {view === 'admin' && <Dashboard onLogout={handleLogout} />}
      {view === 'employee' && <EmployeeApp onLogout={handleLogout} />}
    </>
  );
};

export default App;