import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // 32 chars
const IV = process.env.ENCRYPTION_IV || 'abcdef9876543210'; // 16 chars

function getKeyAndIv() {
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest(); // 32 bytes
    const iv = crypto.createHash('md5').update(IV).digest(); // 16 bytes
    return { key, iv };
}

export function encrypt(text) {
    try {
        const { key, iv } = getKeyAndIv();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (e) {
        console.error('Encrypt error', e);
        return text;
    }
}

export function decrypt(encryptedText) {
    try {
        const { key, iv } = getKeyAndIv();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decrypt error', e);
        return encryptedText;
    }
}

export function encryptObject(obj) {
    return encrypt(JSON.stringify(obj));
}

export function decryptObject(encryptedStr) {
    try {
        const json = decrypt(encryptedStr);
        return JSON.parse(json);
    } catch {
        return null;
    }
}
