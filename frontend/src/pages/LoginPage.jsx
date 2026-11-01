import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, AlertCircle, Loader2, Sun, Moon, User, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function LoginPage() {
  const { login, demoLogin, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState(null);

  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        'Authentication failed. Please verify your credentials and try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError(null);
    setDemoLoadingRole(role);
    try {
      await demoLogin(role);
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        'Demo login failed. Please verify the backend service is running.';
      setError(message);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-page-bg)',
        padding: 'var(--space-6) var(--space-4)',
        position: 'relative',
      }}
    >
      {/* Top Bar with Theme Toggle */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-4)',
          right: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <button
          type="button"
          className="icon-btn icon-btn-bordered"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun size={17} strokeWidth={1.75} style={{ color: 'var(--color-warning)' }} />
          ) : (
            <Moon size={17} strokeWidth={1.75} style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--space-8) var(--space-6)',
          boxShadow: 'var(--shadow-3)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-600)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-3)',
            }}
            aria-hidden="true"
          >
            <GraduationCap size={26} strokeWidth={1.75} />
          </div>
          <h1
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 var(--space-1)',
              letterSpacing: '-0.02em',
            }}
          >
            Sign in to CampusHire
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            Placement Management System
          </p>
        </div>

        {error && (
          <div
            className="alert alert-danger"
            style={{ marginBottom: 'var(--space-5)' }}
            role="alert"
          >
            <AlertCircle size={18} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <Mail size={14} strokeWidth={1.75} />
              <span>Email Address</span>
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@campus.edu"
              autoComplete="username"
              required
              aria-required="true"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label" htmlFor="login-password">
              <Lock size={14} strokeWidth={1.75} />
              <span>Password</span>
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <div className="input-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                aria-required="true"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <Lock size={15} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '44px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} strokeWidth={1.75} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Secondary Demo Login Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: 'var(--space-6) 0 var(--space-4)',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Or explore with demo access
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <button
            type="button"
            id="demo-student-btn"
            className="btn btn-secondary"
            onClick={() => handleDemoLogin('STUDENT')}
            disabled={isSubmitting || !!demoLoadingRole}
            style={{
              height: '42px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {demoLoadingRole === 'STUDENT' ? (
              <>
                <Loader2 size={14} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading…</span>
              </>
            ) : (
              <>
                <User size={14} strokeWidth={1.75} />
                <span>Try Student Demo</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="demo-officer-btn"
            className="btn btn-secondary"
            onClick={() => handleDemoLogin('OFFICER')}
            disabled={isSubmitting || !!demoLoadingRole}
            style={{
              height: '42px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {demoLoadingRole === 'OFFICER' ? (
              <>
                <Loader2 size={14} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading…</span>
              </>
            ) : (
              <>
                <Briefcase size={14} strokeWidth={1.75} />
                <span>Try Officer Demo</span>
              </>
            )}
          </button>
        </div>

        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            margin: '0 0 var(--space-2)',
            lineHeight: 1.4,
          }}
        >
          Demo accounts use sample data. Changes may be reset.
        </p>

        <div
          style={{
            marginTop: 'var(--space-5)',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>New student? </span>
          <Link
            to="/register"
            style={{
              color: 'var(--color-primary-600)',
              fontWeight: 600,
            }}
          >
            Create an account
          </Link>
        </div>

        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border-subtle)',
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>Authorized Access Only • Spring Security JWT</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
