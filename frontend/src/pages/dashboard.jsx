import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import Navbar from '../components/Navbar';
import VideoCall, { getSocket } from '../components/VideoCall';
import axios from 'axios';

export default function Dashboard() {
    const { token, language, user } = useAuth();
    const t = translations[language] || translations.en;
    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [records, setRecords] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const fileInputRef = useRef(null);

    // Doctor specific states
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loadingPatients, setLoadingPatients] = useState(false);

    // Video Call states
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callTarget, setCallTarget] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

    // Socket.io setup for video calling and online status
    useEffect(() => {
        const socket = getSocket();
        if (user) {
            socket.emit('join', { userId: user.id, name: user.name, role: user.role });
        }

        socket.on('onlineUsers', (users) => {
            setOnlineUsers(users);
        });

        socket.on('incomingCall', (callInfo) => {
            setIncomingCall(callInfo);
            setShowVideoCall(true);
        });

        return () => {
            socket.off('onlineUsers');
            socket.off('incomingCall');
        };
    }, [user]);

    const isUserOnline = (userId) => {
        return onlineUsers.some(u => u.userId === userId);
    };

    const fetchPatients = async () => {
        if (!isDoctor) return;
        setLoadingPatients(true);
        try {
            const res = await axios.get(`${API}/api/auth/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(res.data.patients || []);
            if (res.data.patients?.length > 0 && !selectedPatient) {
                setSelectedPatient(res.data.patients[0]);
            }
        } catch (err) {
            console.error('Fetch patients failed', err);
        } finally {
            setLoadingPatients(false);
        }
    };

    const fetchDoctors = async () => {
        // For patients to see doctors list for video call
        if (isDoctor) return;
        try {
            // Reuse patients endpoint but filter doctors - for demo we get all users via custom logic
            // We'll fetch from backend by trying to get all users (we'll create endpoint later, for now mock)
            // For demo, we will use onlineUsers that are doctors
            const onlineDoctors = onlineUsers.filter(u => u.role === 'doctor' || u.role === 'admin');
            setDoctors(onlineDoctors);
        } catch (err) {
            console.error('Fetch doctors failed', err);
        }
    };

    useEffect(() => {
        if (onlineUsers.length > 0 && !isDoctor) {
            fetchDoctors();
        }
    }, [onlineUsers]);

    const fetchData = async (patientId = null) => {
        try {
            setLoading(true);
            let url = `${API}/api/records`;
            if (isDoctor && patientId) {
                url += `?patientId=${patientId}`;
            } else if (isDoctor && selectedPatient) {
                url += `?patientId=${selectedPatient.id}`;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecords(res.data.records || []);
            setTimeline(res.data.timeline || []);
            setConflicts(res.data.conflicts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDoctor) {
            fetchPatients();
        }
    }, [isDoctor]);

    useEffect(() => {
        if (isDoctor) {
            if (selectedPatient) {
                fetchData(selectedPatient.id);
            } else if (patients.length === 0) {
                fetchData();
            }
        } else {
            fetchData();
        }
    }, [selectedPatient]);

    useEffect(() => {
        if (!isDoctor) {
            fetchData();
        }
    }, []);

    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;

        if (isDoctor && selectedPatient) {
            const confirmUpload = confirm(`Upload as Doctor for ${selectedPatient.name}? For demo, this will be added as doctor record but visible in patient view with 'All Records'.`);
            if (!confirmUpload) return;
        }

        setUploading(true);

        for (const file of files) {
            const formData = new FormData();
            formData.append('medicalFile', file);
            formData.append('language', language);

            try {
                await axios.post(`${API}/api/records/upload`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } catch (err) {
                alert('Upload failed: ' + (err.response?.data?.error || err.message));
            }
        }

        if (isDoctor && selectedPatient) {
            await fetchData(selectedPatient.id);
            await fetchPatients();
        } else {
            await fetchData();
        }
        setUploading(false);
    };

    const handleFileChange = (e) => handleUpload(e.target.files);
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files);
        }
    };

    const handleVerify = async (id, status) => {
        try {
            await axios.post(`${API}/api/records/${id}/verify`, { status, notes: `Verified by Dr. ${user?.name}` }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (isDoctor && selectedPatient) fetchData(selectedPatient.id);
            else fetchData();
            setShowDetail(false);
        } catch (err) {
            alert('Verify failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this record permanently? Encrypted data will be wiped.')) return;
        try {
            await axios.delete(`${API}/api/records/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (isDoctor && selectedPatient) {
                fetchData(selectedPatient.id);
                fetchPatients();
            } else {
                fetchData();
            }
            setShowDetail(false);
        } catch (err) {
            alert('Delete failed');
        }
    };

    const viewRecord = async (record) => {
        try {
            const res = await axios.get(`${API}/api/records/${record.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedRecord(res.data);
            setShowDetail(true);
        } catch {
            setSelectedRecord(record);
            setShowDetail(true);
        }
    };

    const startVideoCall = (targetUser) => {
        setCallTarget(targetUser);
        setIncomingCall(null);
        setShowVideoCall(true);
        // The actual call initiation happens inside VideoCall component via window.medisyncInitiateCall
        setTimeout(() => {
            if (window.medisyncInitiateCall) {
                window.medisyncInitiateCall(targetUser);
            }
        }, 500);
    };

    if (loading && !isDoctor) {
        return (
            <div>
                <Navbar />
                <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '16px', color: 'var(--text-light)' }}>Loading encrypted records...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="container" style={{ padding: '24px 0' }}>
                {/* Welcome Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>
                            {isDoctor ? `👨‍⚕️ Doctor Dashboard` : `${t.welcome}`}, {user?.name} 👋
                        </h1>
                        <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                            {isDoctor ? `Viewing patient histories • DOB & Age visible • Video consult • Verify records` : `${t.workflow} • DOB: ${user?.dob ? `${user.dob} (${user?.age} yrs)` : 'Add DOB in profile'} •`} <span className="encryption-badge" style={{ fontSize: '11px' }}>🔒 Encrypted • 📹 Video Call Ready</span>
                        </p>
                        <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>🟢 {onlineUsers.length} online • </span>
                            {isUserOnline(user?.id) && <span className="badge badge-success" style={{ fontSize: '10px' }}>You Online • Video Ready</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '16px' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: '20px' }}>{isDoctor ? patients.length : records.length}</div><div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{isDoctor ? 'Patients' : 'Records'}</div></div>
                            <div style={{ width: '1px', background: 'var(--border)' }}></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: '20px' }}>{timeline.length}</div><div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Timeline</div></div>
                            <div style={{ width: '1px', background: 'var(--border)' }}></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: '20px', color: conflicts.length ? 'var(--warning)' : 'var(--success)' }}>{conflicts.length}</div><div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Issues</div></div>
                        </div>
                    </div>
                </div>

                {/* PATIENT VIEW - Doctor Online List for Video Call */}
                {!isDoctor && (
                    <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', border: '1px solid #BFDBFE' }}>
                        <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>📹 Video Consultation - Call Your Doctor</h3>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', flex: 1, minWidth: '250px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '6px' }}>Your Details (Visible to Doctor):</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                                    👤 {user?.name} • 🎂 {user?.dob ? `${user.dob} (${user?.age} years)` : 'DOB not set'} • {user?.gender || ''} • {user?.email}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {onlineUsers.filter(u => u.role === 'doctor' && u.userId !== user?.id).length > 0 ? (
                                    onlineUsers.filter(u => u.role === 'doctor' && u.userId !== user?.id).map(doc => (
                                        <button key={doc.userId} className="btn btn-primary" style={{ fontSize: '13px' }} onClick={() => startVideoCall({ id: doc.userId, name: doc.name, role: doc.role })}>
                                            📹 Call {doc.name} 🟢 Online
                                        </button>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '13px', color: 'var(--text-light)', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        No doctors online now. Doctor must login as Doctor role to receive video calls. For demo, open incognito → Login as doctor@gmail.com (Doctor) → Then you can call.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* DOCTOR VIEW - Patient Selector with DOB, Age, Video Call */}
                {isDoctor && (
                    <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>👥 My Patients ({patients.length}) - With DOB, Age & Video Call</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={fetchPatients}>🔄 Refresh</button>
                                <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => { setSelectedPatient(null); fetchData(); }}>📋 All Records</button>
                            </div>
                        </div>

                        {loadingPatients ? (
                            <p style={{ color: 'var(--text-light)' }}>Loading patients...</p>
                        ) : patients.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px' }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>👤</div>
                                <h4>No patients yet</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
                                    When patients register with role "Patient" + DOB, they appear here with age.<br />
                                    For demo: Register Patient in incognito with DOB, upload records, then login as Doctor to see.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                                {patients.map(patient => {
                                    const online = isUserOnline(patient.id);
                                    return (
                                        <div
                                            key={patient.id}
                                            className="card"
                                            style={{
                                                padding: '16px',
                                                cursor: 'pointer',
                                                border: selectedPatient?.id === patient.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: selectedPatient?.id === patient.id ? 'var(--primary-light)' : 'white'
                                            }}
                                            onClick={() => setSelectedPatient(patient)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, position: 'relative' }}>
                                                        {patient.name.charAt(0).toUpperCase()}
                                                        {online && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', border: '2px solid white' }}></div>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {patient.name} {online && <span style={{ fontSize: '10px', background: '#10B981', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>🟢 Online</span>}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{patient.email}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                                                            🎂 {patient.dob ? `${new Date(patient.dob).toLocaleDateString()} • ${patient.age} yrs` : 'DOB not set'} {patient.gender ? `• ${patient.gender}` : ''}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>🌐 {patient.preferredLanguage} • Joined {new Date(patient.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                {selectedPatient?.id === patient.id && <span style={{ color: 'var(--primary)' }}>✓</span>}
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                                <span className="badge badge-info">{patient.totalRecords} records</span>
                                                <span className="badge badge-success">{patient.verifiedCount} verified</span>
                                                <span className="badge" style={{ background: '#E0E7FF', color: '#4338CA' }}>{patient.age ? `${patient.age} yrs` : 'Age N/A'}</span>
                                                {online && <span className="badge" style={{ background: '#DCFCE7', color: '#166534' }}>Video Ready</span>}
                                            </div>

                                            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 10px', flex: 1 }} onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}>
                                                    👁️ View Details
                                                </button>
                                                <button className="btn" style={{ fontSize: '11px', padding: '6px 10px', background: '#10B981', color: 'white' }} onClick={(e) => { e.stopPropagation(); startVideoCall({ id: patient.id, name: patient.name, role: patient.role }); }}>
                                                    📹 Video Call {online ? '🟢' : ''}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {selectedPatient && (
                            <div style={{ marginTop: '16px', padding: '14px', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px' }}>📋 Viewing: {selectedPatient.name} • 🎂 {selectedPatient.dob ? `${selectedPatient.dob} (${selectedPatient.age} yrs)` : 'No DOB'} • {selectedPatient.gender || ''}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
                                        Records: {records.length} • Timeline: {timeline.length} • Conflicts: {conflicts.length} • {isUserOnline(selectedPatient.id) ? '🟢 Online - Can video call' : '⚪ Offline'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-primary" style={{ fontSize: '12px', background: '#10B981' }} onClick={() => startVideoCall({ id: selectedPatient.id, name: selectedPatient.name, role: selectedPatient.role })}>
                                        📹 Video Call {selectedPatient.name}
                                    </button>
                                    <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setSelectedPatient(null)}>✕ Clear</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="card">
                            <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📤 {isDoctor ? (selectedPatient ? `Upload for ${selectedPatient.name} (${selectedPatient.age} yrs)` : 'Upload Document') : t.uploadTitle}
                            </h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '16px' }}>{t.uploadDesc}</p>

                            <div className={`upload-zone ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                                <div className="upload-icon">📄</div>
                                <div style={{ fontWeight: 600, marginBottom: '6px' }}>{uploading ? 'Processing with OCR + AI...' : 'Click or drag medical documents here'}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Supports: JPG, PNG, PDF, TXT (Max 10MB) • Encrypted instantly</div>
                                {uploading && <div className="spinner" style={{ margin: '16px auto 0', width: '32px', height: '32px', borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>}
                            </div>

                            <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
                            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="badge badge-info">🔍 OCR</span>
                                <span className="badge badge-info">🧠 AI NLP</span>
                                <span className="badge badge-success">🔒 Encrypted</span>
                                <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>📹 Video Call</span>
                                <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>🎂 Age: {user?.age || 'N/A'} yrs</span>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>📅 {isDoctor ? (selectedPatient ? `${selectedPatient.name}'s Timeline (${selectedPatient.age} yrs)` : 'Timeline') : t.timeline} ({timeline.length})</h3>

                            {timeline.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <h4>{isDoctor ? (selectedPatient ? `No records for ${selectedPatient.name}` : 'No records') : t.noRecords}</h4>
                                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Upload → Extract → Organize → Detect → Timeline → Verify</p>
                                </div>
                            ) : (
                                <div className="timeline">
                                    {timeline.map((item) => (
                                        <div key={item.id} className={`timeline-item ${item.verified ? 'verified' : ''}`}>
                                            <div className="timeline-dot"></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{item.title}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{item.date} • {item.type}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span className="badge badge-info" style={{ fontSize: '11px' }}>{item.confidence}% AI</span>
                                                    {item.verified ? <span className="badge badge-success">✓ Verified</span> : <span className="badge badge-warning">Pending</span>}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px', background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>{item.summary}</p>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                {item.medicines?.slice(0, 3).map((med, i) => (
                                                    <span key={i} className="badge" style={{ background: '#E0F2FE', color: '#0284C7' }}>💊 {med.name}</span>
                                                ))}
                                                {item.diagnosis?.slice(0, 2).map((d, i) => (
                                                    <span key={i} className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>🩺 {d.condition}</span>
                                                ))}
                                            </div>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => viewRecord(records.find(r => r.id === item.id) || item)}>
                                                View Details →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {isDoctor && selectedPatient && (
                            <div className="card" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #BBF7D0' }}>
                                <h3 style={{ marginBottom: '12px' }}>👤 Patient Details - Doctor View + Video</h3>
                                <div style={{ background: 'white', padding: '14px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px' }}>
                                            {selectedPatient.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '18px' }}>{selectedPatient.name} {isUserOnline(selectedPatient.id) ? '🟢' : '⚪'}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{selectedPatient.email}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>🎂 DOB: {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'} • Age: {selectedPatient.age || 'N/A'} years • {selectedPatient.gender || ''}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                                        <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}><div style={{ color: 'var(--text-light)', fontSize: '11px' }}>AGE</div><div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>{selectedPatient.age || 'N/A'} yrs</div></div>
                                        <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}><div style={{ color: 'var(--text-light)', fontSize: '11px' }}>RECORDS</div><div style={{ fontWeight: 700, fontSize: '18px' }}>{selectedPatient.totalRecords}</div></div>
                                        <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}><div style={{ color: 'var(--text-light)', fontSize: '11px' }}>VERIFIED</div><div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--success)' }}>{selectedPatient.verifiedCount}</div></div>
                                        <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}><div style={{ color: 'var(--text-light)', fontSize: '11px' }}>STATUS</div><div style={{ fontWeight: 700, fontSize: '14px' }}>{isUserOnline(selectedPatient.id) ? '🟢 Online' : '⚪ Offline'}</div></div>
                                    </div>

                                    <button className="btn btn-primary" style={{ width: '100%', background: '#10B981', justifyContent: 'center' }} onClick={() => startVideoCall({ id: selectedPatient.id, name: selectedPatient.name, role: selectedPatient.role })}>
                                        📹 Start Video Consultation with {selectedPatient.name} ({selectedPatient.age} yrs)
                                    </button>

                                    <div style={{ marginTop: '12px', padding: '10px', background: '#EFF6FF', borderRadius: '8px', fontSize: '12px', border: '1px solid #BFDBFE' }}>
                                        <strong>👨‍⚕️ Doctor Notes:</strong> Patient age {selectedPatient.age} years is important for dosage calculation. DOB: {selectedPatient.dob}. You can video call for consultation.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ {t.conflicts} ({conflicts.length})</h3>
                            {conflicts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                                    <div style={{ fontWeight: 600, color: '#166534' }}>No conflicts detected</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {conflicts.map((conflict, i) => (
                                        <div key={i} className={`card conflict-card ${conflict.severity}`}>
                                            <span className={`badge ${conflict.severity === 'high' ? 'badge-danger' : 'badge-warning'}`}>{conflict.severity.toUpperCase()}</span>
                                            <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '6px' }}>{conflict.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: '16px' }}>{isDoctor ? 'Recent Records' : t.recentRecords}</h3>
                            {records.length === 0 ? (
                                <div className="empty-state" style={{ padding: '30px' }}><div className="empty-icon" style={{ width: '60px', height: '60px', fontSize: '28px' }}>📁</div><p style={{ fontSize: '14px' }}>No documents yet</p></div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {records.slice(0, 5).map(record => (
                                        <div key={record.id} className="card" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.originalName}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{new Date(record.uploadDate).toLocaleString()}</div>
                                            </div>
                                            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', marginLeft: '12px' }} onClick={() => viewRecord(record)}>View</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDetail && selectedRecord && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }} onClick={() => setShowDetail(false)}>
                    <div className="card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{selectedRecord.originalName || selectedRecord.title}</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>{selectedRecord.uploadDate ? new Date(selectedRecord.uploadDate).toLocaleString() : selectedRecord.date} • 🔒 Decrypted</p>
                            </div>
                            <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>✕</button>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)' }}>
                            <strong>📝 Extracted Text (OCR):</strong><br />{selectedRecord.fullText || selectedRecord.rawTextPreview || selectedRecord.extracted?.summary || 'No text'}
                        </div>
                        <div className="grid-2">
                            <div>
                                <h4 style={{ marginBottom: '10px' }}>💊 Medicines</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedRecord.extracted?.medicines?.map((med, i) => (
                                        <div key={i} style={{ background: 'white', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: 600 }}>{med.name}</div><div style={{ color: 'var(--text-light)', fontSize: '12px' }}>{med.dosage}</div>
                                        </div>
                                    )) || <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No medicines</p>}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ marginBottom: '10px' }}>🩺 Diagnosis & Tests</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedRecord.extracted?.diagnosis?.map((d, i) => (
                                        <div key={i} style={{ background: '#FEF3C7', padding: '8px 10px', borderRadius: '8px', fontSize: '13px' }}>{d.condition}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {!selectedRecord.verified ? (
                                <button className="btn btn-primary" onClick={() => handleVerify(selectedRecord.id, true)}>✅ Verify</button>
                            ) : (
                                <span className="badge badge-success" style={{ padding: '10px 16px' }}>✓ Verified by {selectedRecord.verifiedBy}</span>
                            )}
                            <button className="btn btn-secondary" onClick={() => handleDelete(selectedRecord.id)} style={{ color: 'var(--danger)' }}>🗑️ Delete</button>
                            <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Call Modal */}
            {showVideoCall && (
                <VideoCall
                    initialCallData={incomingCall}
                    onClose={() => {
                        setShowVideoCall(false);
                        setIncomingCall(null);
                        setCallTarget(null);
                    }}
                />
            )}
        </div>
    );
}
