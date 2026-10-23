import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Login } from './pages/Login';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Departments } from './pages/Departments';
import { AttendancePage } from './pages/Attendance';
import { Leaves } from './pages/Leaves';
import { PayrollPage } from './pages/Payroll';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              border: '3px solid var(--slate-200)',
              borderTopColor: 'var(--primary-600)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}
          />
          <p style={{ color: 'var(--slate-600)', fontWeight: 600, fontSize: '0.9375rem' }}>
            Initializing Nexus Enterprise EMS...
          </p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
      {currentTab === 'employees' && <Employees />}
      {currentTab === 'departments' && <Departments />}
      {currentTab === 'attendance' && <AttendancePage />}
      {currentTab === 'leaves' && <Leaves />}
      {currentTab === 'payroll' && <PayrollPage />}
      {currentTab === 'reports' && <ReportsPage />}
      {currentTab === 'settings' && <SettingsPage />}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
