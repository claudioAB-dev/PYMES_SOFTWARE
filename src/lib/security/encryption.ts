import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Helper to get encryption key
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not defined');
    }
    // Expected to be a hex string of 32 bytes (64 characters)
    return Buffer.from(key, 'hex');
}

export function encryptText(text: string) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        encryptedText: encrypted,
        ivHex: iv.toString('hex'),
    };
}

export function decryptText(encryptedText: string, ivHex: string): string {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
