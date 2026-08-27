import multer from 'multer';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'The selected file is too large.' });
    return res.status(400).json({ message: error.message || 'The file upload is invalid.' });
  }
  if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That value is already registered.' });
  if (error?.message?.startsWith('Use a ') || error?.message === 'Unsupported file type') return res.status(400).json({ message: error.message });

  return res.status(error.status || 500).json({
    message: error.status ? error.message : 'An unexpected server error occurred.',
  });
}
