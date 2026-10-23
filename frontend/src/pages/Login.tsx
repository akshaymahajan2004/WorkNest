import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Login: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  };

  const handleDemo = async (role: Role) => {
    setError('');
    await demoLogin(role);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.12) 0%, transparent 40%)',
        padding: '1.5rem'
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)'
            }}
          >
            <ShieldCheck size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.03em' }}>
            Nexus <span style={{ color: 'var(--primary-600)' }}>EMS</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.375rem' }}>
            Enterprise Employee Management & HR Intelligence
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--danger-50)',
              border: '1px solid var(--danger-100)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-700)',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              fontWeight: 500
            }}
          >
            {error}
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Work Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input"
                placeholder="name@nexusglobal.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={isLoading}
              />
              <Mail
                size={18}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={isLoading}
              />
              <Lock
                size={18}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.875rem' }}>
            <UserCheck size={16} color="var(--primary-600)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick 1-Click Demo Accounts
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDemo('ADMIN')}
              className="btn btn-secondary btn-sm"
              disabled={isLoading}
              style={{ flexDirection: 'column', padding: '0.5rem', gap: '0.125rem' }}
            >
              <strong style={{ color: 'var(--primary-700)', fontSize: '0.8125rem' }}>Admin</strong>
              <span style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('HR')}
              className="btn btn-secondary btn-sm"
              disabled={isLoading}
              style={{ flexDirection: 'column', padding: '0.5rem', gap: '0.125rem' }}
            >
              <strong style={{ color: 'var(--warning-600)', fontSize: '0.8125rem' }}>HR Lead</strong>
              <span style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>HR Ops</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('EMPLOYEE')}
              className="btn btn-secondary btn-sm"
              disabled={isLoading}
              style={{ flexDirection: 'column', padding: '0.5rem', gap: '0.125rem' }}
            >
              <strong style={{ color: 'var(--success-600)', fontSize: '0.8125rem' }}>Employee</strong>
              <span style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>Self-Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
