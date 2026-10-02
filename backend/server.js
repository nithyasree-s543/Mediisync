import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import recordRoutes from './routes/records.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(path.join(dataDir, 'uploads'))) fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);

// Video call history storage
const CALLS_FILE = path.join(dataDir, 'calls.json');
function getCalls() {
    if (!fs.existsSync(CALLS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(CALLS_FILE, 'utf8'));
    } catch { return []; }
}
function saveCalls(calls) {
    fs.writeFileSync(CALLS_FILE, JSON.stringify(calls, null, 2));
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'MediSync Backend Running',
        version: '2.0.0',
        features: [
            'End-to-End Encryption (AES-256)',
            'OCR Processing',
            'AI NLP Extraction',
            'Timeline Organization',
            'Conflict Detection',
            'Clinician Verification',
            'Multilingual Support',
            'DOB + Age Calculation',
            'Video Calling (WebRTC + Socket.io)'
        ],
        timestamp: new Date().toISOString()
    });
});

// Get call history
app.get('/api/calls/history', (req, res) => {
    res.json({ calls: getCalls().slice(-50) });
});

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'MediSync API - Connecting Medical Records for Better Care',
        docs: '/api/health',
        endpoints: {
            auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/patients'],
            records: ['POST /api/records/upload', 'GET /api/records', 'GET /api/records/:id', 'POST /api/records/:id/verify'],
            video: ['Socket.io events: join, call:user, call:accept, call:reject, call:end, signal']
        }
    });
});

// ===== SOCKET.IO VIDEO CALLING LOGIC =====
const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> callInfo

io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User joins with their ID
    socket.on('join', ({ userId, name, role }) => {
        onlineUsers.set(userId, { socketId: socket.id, name, role, userId });
        socket.userId = userId;
        console.log(`👤 ${name} (${role}) joined as ${userId}`);
        // Broadcast online users to all
        io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });

    // Initiate video call
    socket.on('call:user', ({ toUserId, fromUserId, fromName, fromRole, callType }) => {
        console.log(`📞 Call from ${fromName} (${fromUserId}) to ${toUserId}`);
        const toUser = onlineUsers.get(toUserId);
        const callId = `${fromUserId}-${toUserId}-${Date.now()}`;

        const callInfo = {
            callId,
            fromUserId,
            toUserId,
            fromName,
            fromRole,
            callType: callType || 'video',
            status: 'ringing',
            timestamp: new Date().toISOString()
        };

        activeCalls.set(callId, callInfo);

        if (toUser) {
            io.to(toUser.socketId).emit('incomingCall', callInfo);
            socket.emit('call:ringing', { callId, toUserId });
        } else {
            socket.emit('call:failed', { message: 'User is offline', callId });
        }
    });

    // Accept call
    socket.on('call:accept', ({ callId, toUserId }) => {
        console.log(`✅ Call accepted: ${callId}`);
        const call = activeCalls.get(callId);
        if (call) {
            call.status = 'accepted';
            activeCalls.set(callId, call);

            const fromUser = onlineUsers.get(call.fromUserId);
            if (fromUser) {
                io.to(fromUser.socketId).emit('call:accepted', { callId, from: toUserId });
            }
            socket.emit('call:accepted', { callId });
        }
    });

    // Reject call
    socket.on('call:reject', ({ callId, toUserId }) => {
        console.log(`❌ Call rejected: ${callId}`);
        const call = activeCalls.get(callId);
        if (call) {
            call.status = 'rejected';
            // Save to history
            const calls = getCalls();
            calls.push(call);
            saveCalls(calls);
            activeCalls.delete(callId);

            const fromUser = onlineUsers.get(call.fromUserId);
            if (fromUser) {
                io.to(fromUser.socketId).emit('call:rejected', { callId });
            }
        }
    });

    // End call
    socket.on('call:end', ({ callId }) => {
        console.log(`📴 Call ended: ${callId}`);
        const call = activeCalls.get(callId);
        if (call) {
            call.status = 'ended';
            call.endedAt = new Date().toISOString();
            const calls = getCalls();
            calls.push(call);
            saveCalls(calls);

            // Notify both parties
            const fromUser = onlineUsers.get(call.fromUserId);
            const toUser = onlineUsers.get(call.toUserId);
            if (fromUser) io.to(fromUser.socketId).emit('call:ended', { callId });
            if (toUser) io.to(toUser.socketId).emit('call:ended', { callId });

            activeCalls.delete(callId);
        }
    });

    // WebRTC signaling - exchange offer/answer/ICE candidates
    socket.on('signal', ({ toUserId, signal, callId }) => {
        const toUser = onlineUsers.get(toUserId);
        if (toUser) {
            io.to(toUser.socketId).emit('signal', {
                fromUserId: socket.userId,
                signal,
                callId
            });
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit('onlineUsers', Array.from(onlineUsers.values()));
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🩺 MediSync Backend running on http://localhost:${PORT}`);
    console.log(`🔐 End-to-End Encryption: ENABLED (AES-256-CBC)`);
    console.log(`📹 Video Calling: ENABLED (Socket.io + WebRTC)`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`📁 Data dir: ${dataDir}\n`);
});
