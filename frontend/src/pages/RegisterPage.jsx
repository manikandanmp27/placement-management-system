import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Hash, AlertCircle, Loader2, ArrowRight, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const parsedStudentId = parseInt(studentId, 10);
    if (!studentId || isNaN(parsedStudentId) || parsedStudentId <= 0) {
      setError('Please enter a valid numeric Student ID.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        studentId: parsedStudentId,
        email: trimmedEmail,
        password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        'Registration failed. Please verify your Student ID and institutional email on the campus roster.';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
          maxWidth: '460px',
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
            Create your student account
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            Use the Student ID and email recorded on the campus roster
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
            <label className="form-label" htmlFor="register-student-id">
              <Hash size={14} strokeWidth={1.75} />
              <span>Student ID</span>
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-student-id"
              type="number"
              inputMode="numeric"
              className="form-input"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 101"
              required
              aria-required="true"
              disabled={isSubmitting}
            />
            <span className="form-help">Your registered roll number in the student directory</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              <Mail size={14} strokeWidth={1.75} />
              <span>Institutional Email</span>
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aarav@campus.edu"
              autoComplete="username"
              required
              aria-required="true"
              disabled={isSubmitting}
            />
            <span className="form-help">Must match the email address recorded by the placement cell</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              <Lock size={14} strokeWidth={1.75} />
              <span>Create Password</span>
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <div className="input-password-wrap">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
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
                {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
            <span className="form-help">Must be at least 8 characters long</span>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label" htmlFor="register-confirm-password">
              <Lock size={14} strokeWidth={1.75} />
              <span>Confirm Password</span>
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <div className="input-password-wrap">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                aria-required="true"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirmPassword}
                tabIndex={-1}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
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
                <span>Registering account…</span>
              </>
            ) : (
              <>
                <span>Register as Student</span>
                <ArrowRight size={16} strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 'var(--space-6)',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>Already registered? </span>
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary-600)',
              fontWeight: 600,
            }}
          >
            Sign in
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
          <span>Campus Placement Portal • Role: ROLE_STUDENT</span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
