import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import axios from 'axios';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, language } = useAuth();
    const navigate = useNavigate();
    const t = translations[language] || translations.en;

    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/api/auth/login`, form);
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Try demo: demo@medisync.com / demo123');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="brand" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                        <div className="brand-icon">M+</div>
                        {t.brand}
                    </Link>
                    <h1>{t.login}</h1>
                    <p>Welcome back! Your records are end-to-end encrypted 🔒</p>
                </div>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', border: '1px solid #BFDBFE' }}>
                    <strong>Demo Account:</strong><br />
                    Email: demo@medisync.com<br />
                    Password: demo123<br />
                    <em>Or create new account</em>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            required
                            placeholder="doctor@hospital.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                        {loading ? <><div className="spinner"></div> Logging in...</> : `${t.login} →`}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-light)' }}>
                    Don't have account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
                    <div style={{ marginTop: '12px' }}>
                        <span className="encryption-badge">🔒 {t.encryptBadge}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
