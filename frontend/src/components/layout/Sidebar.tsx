import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarCheck,
  CreditCard,
  FileBarChart,
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const { user, role, demoLogin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leaves', icon: CalendarCheck },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 40,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.25s ease-in-out',
          transform: mobileOpen || window.innerWidth > 1024 ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.5)'
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Nexus <span style={{ color: 'var(--primary-400)' }}>EMS</span>
            </h1>
            <span style={{ fontSize: '0.6875rem', color: 'var(--slate-400)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Enterprise SaaS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 0.75rem' }}>
            Main Menu
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--slate-300)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={18} color={isActive ? '#ffffff' : 'var(--slate-400)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Demo Role Switcher */}
        <div
          style={{
            padding: '0.875rem 1rem',
            margin: '0.5rem 0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Role Switch
            </span>
            <UserCheck size={14} color="var(--primary-400)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
            {(['ADMIN', 'HR', 'EMPLOYEE'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => demoLogin(r)}
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: role === r ? 'var(--primary-600)' : 'rgba(255, 255, 255, 0.1)',
                  color: role === r ? '#ffffff' : 'var(--slate-300)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {r === 'EMPLOYEE' ? 'Staff' : r}
              </button>
            ))}
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <img
              src={user?.employee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="Avatar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
              </div>
              <span
                className={`badge ${role === 'ADMIN' ? 'badge-primary' : role === 'HR' ? 'badge-warning' : 'badge-slate'}`}
                style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem', marginTop: '0.125rem' }}
              >
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger-500)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-400)'}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};
