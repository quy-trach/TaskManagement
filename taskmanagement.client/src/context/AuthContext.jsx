// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const storedToken = localStorage.getItem('authToken');
                const storedUser = localStorage.getItem('user');

                console.log('Loading stored auth:', {
                    hasToken: !!storedToken,
                    hasUser: !!storedUser,
                    tokenType: typeof storedToken,
                    tokenValue: storedToken?.substring(0, 20) + '...' || 'null'
                });

                if (storedToken && storedUser) {
                    // Đảm bảo token là string
                    const cleanToken = String(storedToken).trim();

                    if (cleanToken && cleanToken !== 'null' && cleanToken !== 'undefined') {
                        setToken(cleanToken);

                        try {
                            const userData = JSON.parse(storedUser);
                            setUser(userData);

                            // Chỉ verify token nếu API endpoint tồn tại
                            // Tạm thời comment lại để tránh lỗi 404
                            /*
                            const response = await fetch('/api/auth/verify', {
                                headers: { 
                                    'Authorization': `Bearer ${cleanToken}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                if (!data.success) {
                                    throw new Error('Token verification failed');
                                }
                            } else {
                                throw new Error(`HTTP ${response.status}`);
                            }
                            */
                        } catch (userParseError) {
                            console.error('Error parsing stored user:', userParseError);
                            clearAuth();
                        }
                    } else {
                        console.log('Invalid token found, clearing auth');
                        clearAuth();
                    }
                } else {
                    console.log('No stored auth found');
                }
            } catch (error) {
                console.error('Error loading stored auth:', error);
                clearAuth();
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, [navigate]);

    const clearAuth = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    const login = (newToken, userData) => {
        try {
            // Đảm bảo token là string hợp lệ
            const cleanToken = String(newToken).trim();

            if (!cleanToken || cleanToken === 'null' || cleanToken === 'undefined') {
                throw new Error('Invalid token provided');
            }

            console.log('Logging in with:', {
                tokenType: typeof newToken,
                tokenLength: cleanToken.length,
                userData
            });

            localStorage.setItem('authToken', cleanToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(cleanToken);
            setUser(userData);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('Logging out...');
        clearAuth();
        navigate('/sign-in');
    };

    // Kiểm tra xem user đã đăng nhập chưa
    const isAuthenticated = !!(user && token);

    const value = {
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook useAuth
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};