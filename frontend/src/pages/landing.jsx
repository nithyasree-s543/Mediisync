import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import Navbar from '../components/Navbar';

export default function Landing() {
    const { language } = useAuth();
    const t = translations[language] || translations.en;

    const features = [
        { icon: '📄', title: 'Medical Document Processing', desc: 'Upload prescriptions, lab reports, scans. OCR extracts text even from handwritten notes.', color: '#E0F2FE' },
        { icon: '🧠', title: 'AI Information Extraction', desc: 'NLP identifies medicines, diagnosis, test results, dates automatically with 85%+ accuracy.', color: '#DCFCE7' },
        { icon: '🔗', title: 'Smart Organization', desc: 'Connects related records, sorts chronologically, builds patient health timeline.', color: '#FEF3C7' },
        { icon: '⚠️', title: 'Conflict Detection', desc: 'Detects dosage conflicts, contradictory diagnosis, missing recent tests.', color: '#FEE2E2' },
        { icon: '📅', title: 'Unified Timeline', desc: 'Single chronological view of entire patient history for faster clinical decisions.', color: '#E0E7FF' },
        { icon: '✅', title: 'Clinician Verification', desc: 'Healthcare professionals review and verify AI-extracted data for safety.', color: '#F0FDF4' },
    ];

    const workflow = [
        { step: 'Upload', icon: '📤', desc: 'Drop medical docs', color: '#0EA5E9' },
        { step: 'Extract', icon: '🔍', desc: 'OCR + AI reads', color: '#8B5CF6' },
        { step: 'Organize', icon: '🗂️', desc: 'Sort & connect', color: '#10B981' },
        { step: 'Detect', icon: '🚨', desc: 'Find conflicts', color: '#F59E0B' },
        { step: 'Timeline', icon: '📈', desc: 'Build history', color: '#EC4899' },
        { step: 'Verify', icon: '👨‍⚕️', desc: 'Doctor confirms', color: '#06B6D4' },
    ];

    return (
        <div>
            <Navbar />

            {/* Hero */}
            <section className="hero">
                <div className="container">
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', background: 'white', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
                        <span>🔒</span> End-to-End Encrypted • HIPAA Ready • {t.language}: 8 Supported
                    </div>
                    <h1>
                        {t.heroTitle} <br />
                        <span>{t.heroHighlight}</span>
                    </h1>
                    <p>{t.heroDesc}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-large">{t.getStarted} →</Link>
                        <Link to="/login" className="btn btn-secondary btn-large">Watch Demo</Link>
                    </div>

                    <div style={{ marginTop: '40px', background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
                        </div>
                        <div className="workflow">
                            {workflow.map((w, i) => (
                                <div key={i} className="workflow-step">
                                    <div className="workflow-icon" style={{ background: `${w.color}20`, color: w.color }}>{w.icon}</div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{w.step}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{w.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem & Solution */}
            <section style={{ padding: '60px 0', background: 'white' }}>
                <div className="container">
                    <div className="grid-2" style={{ alignItems: 'center' }}>
                        <div>
                            <div className="badge badge-danger" style={{ marginBottom: '16px' }}>❌ The Problem</div>
                            <h2 style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.2 }}>Medical data is everywhere, but not connected</h2>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    'Scattered prescriptions, reports, scans in different places',
                                    'Doctors waste time searching through old papers',
                                    'Missing information leads to incomplete diagnosis',
                                    'Conflicting records cause medication errors'
                                ].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--danger)' }}>✕</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="badge badge-success" style={{ marginBottom: '16px' }}>✓ Our Solution: MediSync</div>
                            <h2 style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.2 }}>One timeline for complete patient history</h2>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    'Upload → AI extracts medicines, diagnosis, dates',
                                    'Smart organization chronologically',
                                    'Detects conflicts & missing info automatically',
                                    'Clinician verifies - safe & accurate'
                                ].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--success)' }}>✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '60px 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '36px', marginBottom: '12px' }}>{t.features}</h2>
                        <p style={{ color: 'var(--text-light)' }}>Everything you need to manage medical records efficiently</p>
                    </div>
                    <div className="grid-3">
                        {features.map((f, i) => (
                            <div key={i} className="card">
                                <div className="card-icon" style={{ background: f.color }}>{f.icon}</div>
                                <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Languages & Security */}
            <section style={{ padding: '60px 0', background: 'white' }}>
                <div className="container">
                    <div className="grid-2">
                        <div className="card" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' }}>
                            <h3 style={{ marginBottom: '16px' }}>🌐 Multilingual Support (8 Languages)</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['English', 'हिन्दी Hindi', 'বাংলা Bengali', 'मराठी Marathi', 'తెలుగు Telugu', 'தமிழ் Tamil', 'ગુજરાતી Gujarati', 'اردو Urdu'].map(lang => (
                                    <span key={lang} className="badge badge-success">{lang}</span>
                                ))}
                            </div>
                            <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-light)' }}>Patients and doctors can view timeline, medicines, diagnosis in their preferred language. Auto-translation for medical terms.</p>
                        </div>
                        <div className="card" style={{ background: 'linear-gradient(135deg, #EFF6FF, #E0F2FE)' }}>
                            <h3 style={{ marginBottom: '16px' }}>🔐 End-to-End Encryption</h3>
                            <ul style={{ fontSize: '14px', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
                                <li>AES-256-CBC encryption at rest</li>
                                <li>Encrypted in transit (TLS)</li>
                                <li>Zero-knowledge architecture - even we can't read your data</li>
                                <li>HIPAA & GDPR compliant design</li>
                                <li>Secure file wipe after deletion</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '40px 0', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'white' }}>
                <div className="container">
                    <div className="brand" style={{ justifyContent: 'center', marginBottom: '12px' }}>
                        <div className="brand-icon">M+</div>
                        MediSync
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Connecting Medical Records for Better Care • Built for Judges Demo • 2026</p>
                    <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-light)' }}>Workflow: Upload → Extract → Organize → Detect → Timeline → Verify</p>
                </div>
            </footer>
        </div>
    );
}
