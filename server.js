const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const JOBS_DIR = path.join(__dirname, 'jobs');
const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

[JOBS_DIR, UPLOADS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// Multer: 1MB limit, any file type
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, uuidv4() + '_' + file.originalname)
});
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// POST /submit — upload file and run backend.sh
app.post('/submit', upload.single('inputfile'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const token = uuidv4();
  const jobFile = path.join(JOBS_DIR, `${token}.json`);
  const uploadedPath = req.file.path;

  // Save initial job state
  const job = {
    token,
    filename: req.file.originalname,
    status: 'running',
    submitted: new Date().toISOString(),
    output: null,
    error: null,
    completed: null
  };
  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  // Run backend.sh from SCRIPTS_DIR so checksum and checksum.c are accessible
  execFile('bash', ['backend.sh', uploadedPath], {
    cwd: SCRIPTS_DIR,
    timeout: 60000,
    maxBuffer: 1024 * 1024
  }, (err, stdout, stderr) => {
    job.completed = new Date().toISOString();
    job.output = stdout || '';
    job.error = stderr || '';
    job.status = err && !stdout ? 'failed' : 'done';
    fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));
    // Clean up uploaded file
    fs.unlink(uploadedPath, () => {});
  });

  res.json({ token });
});

// GET /status/:token — poll job status
app.get('/status/:token', (req, res) => {
  const token = req.params.token;
  // Basic validation to prevent path traversal
  if (!/^[0-9a-f-]{36}$/.test(token)) return res.status(400).json({ error: 'Invalid token.' });
  const jobFile = path.join(JOBS_DIR, `${token}.json`);
  if (!fs.existsSync(jobFile)) return res.status(404).json({ error: 'Job not found.' });
  res.json(JSON.parse(fs.readFileSync(jobFile)));
});

// Handle multer file-too-large error
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 1MB.' });
  }
  next(err);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
