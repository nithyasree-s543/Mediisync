import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations, languages } from '../i18n/translations';
import axios from 'axios';

function calculateAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient',
        preferredLanguage: 'en',
        dob: '',
        gender: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, language } = useAuth();
    const navigate = useNavigate();
    const t = translations[language] || translations.en;

    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const age = calculateAge(form.dob);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/api/auth/register`, form);
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ maxWidth: '520px' }}>
                <div className="auth-header">
                    <Link to="/" className="brand" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                        <div className="brand-icon">M+</div>
                        {t.brand}
                    </Link>
                    <h1>Create Account</h1>
                    <p>Join MediSync - Your medical data, encrypted & connected</p>
                </div>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            className="form-input"
                            required
                            placeholder="Dr. Rajesh Kumar / Ramesh Patient"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            className="form-input"
                            type="email"
                            required
                            placeholder="you@hospital.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Role *</label>
                            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor / Clinician</option>
                                <option value="admin">Hospital Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t.language}</label>
                            <select className="form-select" value={form.preferredLanguage} onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}>
                                {languages.map(l => (
                                    <option key={l.code} value={l.code}>{l.native} - {l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* DOB Section - Only show for patients, but allow for all */}
                    <div style={{ background: '#F0F9FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎂 Date of Birth & Age (For Patients)
                            {form.role === 'patient' && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>*Required for age calculation</span>}
                        </h4>

                        <div className="grid-2">
                            <div className="form-group" style={{ marginBottom: '12px' }}>
                                <label className="form-label">Date of Birth {form.role === 'patient' ? '*' : ''}</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    required={form.role === 'patient'}
                                    max={new Date().toISOString().split('T')[0]}
                                    value={form.dob}
                                    onChange={e => setForm({ ...form, dob: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '12px' }}>
                                <label className="form-label">Gender</label>
                                <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                </select>
                            </div>
                        </div>

                        {form.dob && (
                            <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>CALCULATED AGE</div>
                                    <div style={{ fontWeight: 700, fontSize: '20px', color: 'var(--primary)' }}>{age} years old</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>DOB: {new Date(form.dob).toLocaleDateString()} • Will be visible to doctor for better care</div>
                                </div>
                                <div style={{ fontSize: '32px' }}>🎂</div>
                            </div>
                        )}

                        {!form.dob && form.role === 'patient' && (
                            <div style={{ fontSize: '12px', color: 'var(--text-light)', background: '#FEF3C7', padding: '8px', borderRadius: '6px' }}>
                                💡 Doctors need your age for dosage calculation and diagnosis. Please add DOB.
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone (Optional, Encrypted)</label>
                        <input
                            className="form-input"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input
                            className="form-input"
                            type="password"
                            required
                            placeholder="Minimum 6 characters"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }}>
                        🔒 <strong>End-to-End Encryption:</strong> Your name, DOB, phone, records are encrypted with AES-256. Only you and your authorized doctor can decrypt. Age is calculated locally: <code>Today - DOB</code>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                        {loading ? <><div className="spinner"></div> Creating...</> : `Create Account →`}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-light)' }}>
                    Already have account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
                </div>
            </div>
        </div>
    );
}
