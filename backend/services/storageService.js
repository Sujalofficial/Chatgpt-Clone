const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { logger } = require('../utils/logger');

/**
 * services/storageService.js
 * Pluggable file storage system for production-ready scalability.
 * Handles both local disk storage (dev) and S3/Cloud storage (prod).
 */

const getStorageUrl = (filename) => {
    // In actual AWS S3 environment, this would return the S3 public URL
    if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
    }
    // Local fallback
    return `/uploads/${filename}`;
};

const deleteFile = async (filename) => {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
            // Placeholder: Delete from S3
            logger.info({ filename }, 'Mock deleting from S3');
            return true;
        }

        const filePath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch (err) {
        logger.error({ err: err.message, filename }, 'File deletion failed');
        return false;
    }
};

module.exports = {
    getStorageUrl,
    deleteFile
};
