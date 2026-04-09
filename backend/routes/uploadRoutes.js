const storageService = require('../services/storageService');

router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Abstracted storage logic: local fallback or S3 cloud logic
  const fileUrl = storageService.getStorageUrl(req.file.filename);
  
  let extractedText = null;
  if (req.file.mimetype === 'application/pdf') {
      try {
          const path = require('path');
          const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
          extractedText = await extractText(filePath);
      } catch (err) {
          logger.error({ err: err.message }, 'PDF text extraction failed');
      }
  }

  res.json({ 
    success: true,
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    extractedText: extractedText
  });
});

module.exports = router;
