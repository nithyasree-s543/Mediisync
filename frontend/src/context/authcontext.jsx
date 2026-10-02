import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const savedToken = localStorage.getItem('medisync_token');
        const savedUser = localStorage.getItem('medisync_user');
        const savedLang = localStorage.getItem('medisync_lang') || 'en';

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLanguage(savedLang);
        setLoading(false);
    }, []);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('medisync_token', jwtToken);
        localStorage.setItem('medisync_user', JSON.stringify(userData));
        if (userData.preferredLanguage) {
            setLanguage(userData.preferredLanguage);
            localStorage.setItem('medisync_lang', userData.preferredLanguage);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('medisync_token');
        localStorage.removeItem('medisync_user');
    };

    const changeLanguage = (langCode) => {
        setLanguage(langCode);
        localStorage.setItem('medisync_lang', langCode);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, language, changeLanguage, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
