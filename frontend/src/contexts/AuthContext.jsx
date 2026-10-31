import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth';
import { getStoredToken, setStoredToken, removeStoredToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setStoredToken(data.token);
    setToken(data.token);
    
    // Fetch authoritative profile via /api/auth/me
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      return profile;
    } catch {
      // Fall back to login response if profile fetch fails
      const fallbackUser = {
        userId: data.userId,
        email: data.email,
        role: data.role,
        studentId: data.studentId,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  const register = useCallback(async (studentData) => {
    const data = await authApi.registerStudent(studentData);
    setStoredToken(data.token);
    setToken(data.token);

    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      return profile;
    } catch {
      const fallbackUser = {
        userId: data.userId,
        email: data.email,
        role: data.role,
        studentId: data.studentId,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const savedToken = getStoredToken();
      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const profile = await authApi.getProfile();
        if (isMounted) {
          setUser(profile);
          setToken(savedToken);
        }
      } catch {
        removeStoredToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    validateSession();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'ROLE_STUDENT',
    isOfficer: user?.role === 'ROLE_PLACEMENT_OFFICER',
    isAdmin: user?.role === 'ROLE_ADMIN',
    hasRole: (roles) => (roles && user?.role ? roles.includes(user.role) : false),
    login,
    register,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
