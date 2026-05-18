import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');
      try {
        setIsLoading(true);
        setError(null);
        
        const { isAuthenticated: authStatus, user: userData } = await authService.checkAuth();
        
        if (!mounted) return;
        
        if (authStatus && userData) {
          console.log('[AuthContext] Found stored auth, verifying...');
          // Verify token is still valid by fetching current user with timeout
          const currentUser = await Promise.race([
            authService.getCurrentUser(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth verification timeout')), 5000)
            )
          ]).catch(err => {
            console.warn('[AuthContext] Auth verification failed:', err.message);
            return null;
          });
          
          if (!mounted) return;
          
          if (currentUser) {
            console.log('[AuthContext] User authenticated:', currentUser.username);
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            console.log('[AuthContext] Auth verification failed, clearing session');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('[AuthContext] No stored authentication');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error);
        if (mounted) {
          setError(error.message);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log('[AuthContext] Auth initialization complete');
        }
      }
    };
    
    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const { isAuthenticated: authStatus, user: userData } = await authService.checkAuth();
      
      if (authStatus && userData) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const result = await authService.login(username, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
