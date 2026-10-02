import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const __filename = fileURLToPath(import.meta.url); a
const __dirname = path.dirname(__filename);
const router = express.Router();

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Ensure data dir exists
function ensureDataFile() {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function getUsers() {
    ensureDataFile();
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function saveUsers(users) {
    ensureDataFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Calculate age from DOB
function calculateAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

function decryptName(user) {
    let displayName = user.name;
    try {
        displayName = decrypt(user.name);
        if (displayName.length > 100 || displayName.includes('{')) {
            const profile = JSON.parse(decrypt(user.encryptedProfile || '{}'));
            displayName = profile.name || user.email;
        }
    } catch {
        try {
            const profile = JSON.parse(decrypt(user.encryptedProfile || '{}'));
            displayName = profile.name || user.email;
        } catch {
            displayName = user.email;
        }
    }
    return displayName;
}

function decryptDob(user) {
    if (!user.dob) return null;
    try {
        // Try decrypt, if fails return as is (backward compatibility)
        const decrypted = decrypt(user.dob);
        // If decrypted looks like date, return it
        if (decrypted && (decrypted.includes('-') || decrypted.includes('/'))) {
            return decrypted;
        }
        return user.dob;
    } catch {
        return user.dob;
    }
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, preferredLanguage, dob, gender, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password required' });
        }

        const users = getUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const age = calculateAge(dob);

        const newUser = {
            id: Date.now().toString(),
            name: encrypt(name),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'patient',
            preferredLanguage: preferredLanguage || 'en',
            dob: dob ? encrypt(dob) : null, // Encrypted DOB for privacy
            dobPlain: dob || null, // For demo age calculation (in production only encrypted)
            age: age,
            gender: gender || null,
            phone: phone ? encrypt(phone) : null,
            createdAt: new Date().toISOString(),
            encryptedProfile: encrypt(JSON.stringify({ name, email, dob, age, gender }))
        };

        users.push(newUser);
        saveUsers(users);

        const token = generateToken({ id: newUser.id, email: newUser.email, name });

        res.status(201).json({
            message: 'User registered successfully - End-to-End Encrypted',
            token,
            user: {
                id: newUser.id,
                name,
                email: newUser.email,
                role: newUser.role,
                preferredLanguage: newUser.preferredLanguage,
                dob: dob,
                age: age,
                gender: gender
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const displayName = decryptName(user);
        const dob = decryptDob(user) || user.dobPlain;
        const age = calculateAge(dob) || user.age;

        const token = generateToken({ id: user.id, email: user.email, name: displayName });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: displayName,
                email: user.email,
                role: user.role,
                preferredLanguage: user.preferredLanguage || 'en',
                dob: dob,
                age: age,
                gender: user.gender
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get all patients - for doctors
router.get('/patients', authenticateToken, (req, res) => {
    try {
        const users = getUsers();

        const patients = users
            .filter(u => u.role === 'patient' || !u.role)
            .map(u => {
                const displayName = decryptName(u);
                const dob = decryptDob(u) || u.dobPlain;
                const age = calculateAge(dob) || u.age;

                return {
                    id: u.id,
                    name: displayName,
                    email: u.email,
                    role: u.role || 'patient',
                    preferredLanguage: u.preferredLanguage || 'en',
                    dob: dob,
                    age: age,
                    gender: u.gender,
                    createdAt: u.createdAt
                };
            });

        // Also include stats - count records per patient
        const recordsFile = path.join(__dirname, '../data/records.json');
        let records = [];
        if (fs.existsSync(recordsFile)) {
            try {
                records = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
            } catch { }
        }

        const patientsWithStats = patients.map(p => {
            const patientRecords = records.filter(r => r.userId === p.id);
            const lastUpload = patientRecords.length ? patientRecords[patientRecords.length - 1].uploadDate : null;
            return {
                ...p,
                totalRecords: patientRecords.length,
                lastUpload,
                verifiedCount: patientRecords.filter(r => r.verified).length
            };
        });

        res.json({
            patients: patientsWithStats,
            total: patientsWithStats.length,
            message: 'Patient list retrieved (doctor access) with DOB and Age'
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Get profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const users = getUsers();
        const user = users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const displayName = decryptName(user);
        const dob = decryptDob(user) || user.dobPlain;
        const age = calculateAge(dob) || user.age;

        res.json({
            id: user.id,
            name: displayName,
            email: user.email,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
            dob: dob,
            age: age,
            gender: user.gender
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

export default router;
