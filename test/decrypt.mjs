import crypto from 'crypto';
import fs from 'fs';

const VERSION_SIZE = 1;
const GCM_IV_SIZE = 12;
const GCM_TAG_SIZE = 16;
const CURRENT_VERSION = 1;
const ENCYPTION_KEY_HEX = '7312725575a3789d43bd41e592d1042226bc0d1a5d9bd9c4e8e58f121a1d5550';

(async () => {

    try {

        if (process.argv.length < 3) {
            throw new Error('Please supply payload / encryption arguments to the decrypt.mjs program');
        }
    
        const payload = process.argv[2];
        const encryptionKeyBytes = Buffer.from(ENCYPTION_KEY_HEX, 'hex');

        const result = decryptCookie(payload, encryptionKeyBytes);
        await writeResult(result);

    } catch (e) {

        await writeResult(e.message);
        process.exit(1);
    }
})();

/*
 * Unpack concatenated data and decrypt the payload
 */
function decryptCookie(payloadBase64url, encryptionKeyBytes) {

    const payloadbase64 = base64urldecode(payloadBase64url);
    const allBytes = Buffer.from(payloadbase64, 'base64');
    
    const minSize = VERSION_SIZE + GCM_IV_SIZE + 1 + GCM_TAG_SIZE;
    if (allBytes.length < minSize) {
        throw new Error('The received cookie has an invalid length');
    }

    // If the version ever changes, the SPA will receive a 401 error
    const version = allBytes[0];
    if (version != CURRENT_VERSION) {
        throw new Error('The received cookie has an invalid format')
    }

    let offset = VERSION_SIZE
    const ivBytes = allBytes.slice(offset, offset + GCM_IV_SIZE);

    offset = VERSION_SIZE + GCM_IV_SIZE
    const ciphertextBytes = allBytes.slice(offset, allBytes.length - GCM_TAG_SIZE);

    offset = allBytes.length - GCM_TAG_SIZE
    const tagBytes = allBytes.slice(offset, allBytes.length);

    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKeyBytes, ivBytes);
    decipher.setAuthTag(tagBytes);
    const plaintextBytes = Buffer.concat([decipher.update(ciphertextBytes), decipher.final()]);

    return plaintextBytes.toString('ascii');
}

/*
 * Adjust text to base 64
 */
function base64urldecode(base64urltext) {
    
    let base64text = base64urltext.replace('-', '+').replace('_', '/');

    switch (base64text.length) {

        case 2:
            return base64text + '==';
        case 3:
            return base64text + '=';
    }

    return base64text;
}

/*
 * Write the result to a file
 */
function writeResult(result) {

    return new Promise((resolve, reject) => {

        fs.writeFile('./decryption_result.txt', result, err => {
            if (err) {
                reject(err);
            }
            
            resolve();
        });
    });
}
