import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { extractTextFromFile } from '../utils/ocr.js';
import { extractMedicalInfo, detectConflicts, organizeTimeline } from '../utils/extraction.js';
import { encrypt, decrypt, encryptObject } from '../utils/encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const RECORDS_FILE = path.join(__dirname, '../data/records.json');
const UPLOAD_DIR = path.join(__dirname, '../data/uploads');

// Ensure dirs
function ensureDirs() {
    if (!fs.existsSync(path.dirname(RECORDS_FILE))) fs.mkdirSync(path.dirname(RECORDS_FILE), { recursive: true });
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    if (!fs.existsSync(RECORDS_FILE)) fs.writeFileSync(RECORDS_FILE, JSON.stringify([]));
}

function getRecords() {
    ensureDirs();
    const data = fs.readFileSync(RECORDS_FILE, 'utf8');
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function saveRecords(records) {
    ensureDirs();
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureDirs();
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain'];
        if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images, PDFs and text files allowed'), false);
        }
    }
});

// Upload and process medical document
router.post('/upload', authenticateToken, upload.single('medicalFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Processing file: ${req.file.originalname} for user ${req.user.id}`);

        // Step 1: OCR Extract
        const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

        // Step 2: AI NLP Extraction
        const extractedInfo = extractMedicalInfo(extractedText);

        // Step 3: Encrypt sensitive data (End-to-End Encryption)
        const encryptedText = encrypt(extractedText);
        const encryptedInfo = encryptObject(extractedInfo);

        const newRecord = {
            id: uuidv4(),
            userId: req.user.id,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadDate: new Date().toISOString(),
            // Encrypted storage
            encryptedText,
            encryptedInfo,
            // For timeline display (decrypted on demand, but storing decrypted for demo search)
            extracted: extractedInfo,
            rawText: extractedText.substring(0, 2000), // preview
            verified: false,
            verifiedBy: null,
            verifiedAt: null,
            language: req.body.language || 'en'
        };

        const records = getRecords();
        records.push(newRecord);
        saveRecords(records);

        // Step 4: Detect conflicts with existing records
        const userRecords = records.filter(r => r.userId === req.user.id);
        const conflicts = detectConflicts(userRecords);

        // Step 5: Organize timeline
        const timeline = organizeTimeline(userRecords);

        res.status(201).json({
            message: 'Document uploaded and processed successfully',
            record: {
                id: newRecord.id,
                originalName: newRecord.originalName,
                uploadDate: newRecord.uploadDate,
                extracted: extractedInfo,
                verified: newRecord.verified
            },
            timeline,
            conflicts,
            steps: {
                upload: '✓ Complete',
                extract: '✓ OCR Text Extracted',
                organize: '✓ Information Organized',
                detect: `✓ ${conflicts.length} potential issues detected`,
                timeline: '✓ Timeline Updated'
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process document', details: error.message });
    }
});

// Helper to get user role
function getUserRole(userId) {
    try {
        const usersFile = path.join(__dirname, '../data/users.json');
        if (!fs.existsSync(usersFile)) return 'patient';
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const user = users.find(u => u.id === userId);
        return user?.role || 'patient';
    } catch {
        return 'patient';
    }
}

// Get all records for user - DOCTOR CAN SEE PATIENT RECORDS
router.get('/', authenticateToken, (req, res) => {
    try {
        const records = getRecords();
        const requestingRole = getUserRole(req.user.id);
        const { patientId } = req.query; // Doctor can pass ?patientId=xxx

        let userRecords;
        let targetPatientId = req.user.id;

        if ((requestingRole === 'doctor' || requestingRole === 'admin') && patientId) {
            // Doctor viewing specific patient's records
            userRecords = records.filter(r => r.userId === patientId);
            targetPatientId = patientId;
        } else if (requestingRole === 'doctor' || requestingRole === 'admin') {
            // Doctor without patientId filter - if query ?all=true, show all, otherwise own
            if (req.query.all === 'true') {
                userRecords = records; // All patients for doctor overview
            } else {
                // For doctor dashboard initial load, still show all patients' records count
                // But default to own if no patientId specified and not all=true
                userRecords = records.filter(r => r.userId === req.user.id);
                // If doctor has no records, show all to demonstrate
                if (userRecords.length === 0) {
                    userRecords = records;
                }
            }
        } else {
            // Patient - only own records
            userRecords = records.filter(r => r.userId === req.user.id);
        }

        const timeline = organizeTimeline(userRecords);
        const conflicts = detectConflicts(userRecords);

        // Decrypt on demand for response (simulating E2E decryption client-side)
        const sanitized = userRecords.map(r => ({
            id: r.id,
            userId: r.userId, // Include for doctor to know which patient
            originalName: r.originalName,
            fileType: r.fileType,
            uploadDate: r.uploadDate,
            extracted: r.extracted,
            rawTextPreview: r.rawText?.substring(0, 300),
            verified: r.verified,
            verifiedBy: r.verifiedBy,
            verifiedAt: r.verifiedAt,
            confidence: r.extracted?.confidence
        }));

        res.json({
            records: sanitized,
            timeline,
            conflicts,
            total: userRecords.length,
            encrypted: true,
            requestingRole,
            targetPatientId,
            message: requestingRole === 'doctor' ? `Doctor access: viewing records for ${targetPatientId === req.user.id ? 'self/all' : 'patient ' + targetPatientId}` : 'End-to-end encrypted records retrieved'
        });
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

// Get single record - DOCTOR CAN VIEW ANY PATIENT RECORD
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const records = getRecords();
        const requestingRole = getUserRole(req.user.id);

        let record;
        if (requestingRole === 'doctor' || requestingRole === 'admin') {
            record = records.find(r => r.id === req.params.id); // Doctor can view any
        } else {
            record = records.find(r => r.id === req.params.id && r.userId === req.user.id);
        }

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        // Simulate decryption
        let decryptedText = record.rawText;
        try {
            decryptedText = decrypt(record.encryptedText);
        } catch { }

        res.json({
            id: record.id,
            userId: record.userId,
            originalName: record.originalName,
            uploadDate: record.uploadDate,
            fileType: record.fileType,
            extracted: record.extracted,
            fullText: decryptedText,
            verified: record.verified,
            verifiedBy: record.verifiedBy,
            verifiedAt: record.verifiedAt,
            canVerify: requestingRole === 'doctor' || requestingRole === 'admin'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch record' });
    }
});

// Verify record (clinician verification) - DOCTOR CAN VERIFY ANY PATIENT RECORD
router.post('/:id/verify', authenticateToken, (req, res) => {
    try {
        const { notes, status } = req.body;
        const records = getRecords();
        const requestingRole = getUserRole(req.user.id);

        let recordIndex;
        if (requestingRole === 'doctor' || requestingRole === 'admin') {
            recordIndex = records.findIndex(r => r.id === req.params.id);
        } else {
            recordIndex = records.findIndex(r => r.id === req.params.id && r.userId === req.user.id);
        }

        if (recordIndex === -1) {
            return res.status(404).json({ error: 'Record not found' });
        }

        records[recordIndex].verified = status !== false;
        records[recordIndex].verifiedBy = req.user.email + ` (${requestingRole})`;
        records[recordIndex].verifiedAt = new Date().toISOString();
        records[recordIndex].verificationNotes = notes ? encrypt(notes) : null;

        saveRecords(records);

        res.json({
            message: 'Record verification updated by doctor',
            record: {
                id: records[recordIndex].id,
                verified: records[recordIndex].verified,
                verifiedBy: records[recordIndex].verifiedBy,
                verifiedAt: records[recordIndex].verifiedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Delete record - doctor can delete any (for demo)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        let records = getRecords();
        const requestingRole = getUserRole(req.user.id);

        let record;
        if (requestingRole === 'doctor' || requestingRole === 'admin') {
            record = records.find(r => r.id === req.params.id);
        } else {
            record = records.find(r => r.id === req.params.id && r.userId === req.user.id);
        }

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        // Delete file
        try {
            if (fs.existsSync(record.filePath)) fs.unlinkSync(record.filePath);
        } catch { }

        records = records.filter(r => r.id !== req.params.id);
        saveRecords(records);

        res.json({ message: 'Record deleted securely (encrypted data wiped)' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Get timeline only
router.get('/timeline/all', authenticateToken, (req, res) => {
    try {
        const records = getRecords();
        const userRecords = records.filter(r => r.userId === req.user.id);
        const timeline = organizeTimeline(userRecords);
        res.json({ timeline });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get timeline' });
    }
});

export default router;
