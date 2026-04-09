const path = require('path');
const { extractText } = require('./pdfService');

/**
 * fileService.js
 * Handles file analysis (PDF extraction, Image description triggers)
 */

const fileService = {
  /**
   * Extracts text from a PDF file (delegates to pdfService which uses pdf2json)
   */
  extractPdfText: async (filePath) => {
    try {
      return await extractText(filePath);
    } catch (err) {
      console.error('PDF extraction error:', err);
      return '';
    }
  },

  /**
   * Helper to identify file type by extension
   */
  getFileType: (fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
    if (ext === '.pdf') return 'pdf';
    return 'unknown';
  }
};

module.exports = fileService;
