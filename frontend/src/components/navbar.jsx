import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations, languages } from '../i18n/translations';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout, language, changeLanguage, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [showLang, setShowLang] = useState(false);
    const t = translations[language] || translations.en;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="container nav-inner">
                <Link to="/" className="brand">
                    <div className="brand-icon">M+</div>
                    <span>{t.brand}</span>
                </Link>

                <div className="nav-actions">
                    {/* Language Selector */}
                    <div className="lang-selector">
                        <button className="lang-btn" onClick={() => setShowLang(!showLang)}>
                            🌐 {languages.find(l => l.code === language)?.native || 'English'} ▾
                        </button>
                        {showLang && (
                            <div className="lang-dropdown">
                                {languages.map(lang => (
                                    <div
                                        key={lang.code}
                                        className={`lang-option ${language === lang.code ? 'active' : ''}`}
                                        onClick={() => { changeLanguage(lang.code); setShowLang(false); }}
                                    >
                                        <span>{lang.native}</span>
                                        <span style={{ opacity: 0.6, fontSize: '12px' }}>{lang.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="encryption-badge">{t.encryptBadge}</div>

                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="btn btn-secondary">{t.dashboard}</Link>
                            <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>Hi, {user?.name}</span>
                            <button onClick={handleLogout} className="btn btn-ghost">{t.logout}</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">{t.login}</Link>
                            <Link to="/register" className="btn btn-primary">{t.signup}</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
