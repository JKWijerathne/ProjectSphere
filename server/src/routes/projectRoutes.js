import express from 'express';

const router = express.Router();

// Placeholder route - we'll add real routes next
router.get('/test', (req, res) => {
  res.json({ message: 'Project routes working!' });
});

export default router;