'use strict';

const fs   = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

/**
 * pdfService.js
 * PDF text extraction using pdf2json (pdf-parse v2.x is broken — no parse function exported)
 */

// pdf2json URL-encodes text; decode safely to handle literal '%' chars in PDFs
const safeDecode = (str) => {
    try {
        return decodeURIComponent(str);
    } catch {
        // Fall back to replacing %XX only where valid, leave rest as-is
        return str.replace(/%[0-9A-Fa-f]{2}/g, (m) => {
            try { return decodeURIComponent(m); } catch { return m; }
        });
    }
};

const extractText = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error('PDF file not found at path: ' + filePath));
        }

        const pdfParser = new PDFParser(null, 1);

        pdfParser.on('pdfParser_dataError', (errData) => {
            console.error('❌ [pdfService] Parse error:', errData.parserError);
            resolve('Error parsing PDF: ' + errData.parserError);
        });

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
                const pages = pdfData.Pages || [];
                const text = pages
                    .map(page =>
                        (page.Texts || [])
                            .map(t =>
                                (t.R || [])
                                    .map(r => safeDecode(r.T || ''))
                                    .join('')
                            )
                            .join(' ')
                    )
                    .join('\n\n')
                    .trim();

                if (!text) {
                    console.warn('[pdfService] No readable text found in PDF.');
                    return resolve('No readable text found in this PDF.');
                }

                console.log(`✅ [pdfService] Extracted ${text.length} chars from ${path.basename(filePath)}`);
                resolve(text);
            } catch (err) {
                console.error('❌ [pdfService] Text assembly error:', err.message);
                resolve('Error assembling PDF text: ' + err.message);
            }
        });

        pdfParser.loadPDF(filePath);
    });
};

module.exports = { extractText };
