import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const users = [];
const submissions = [];
const reviews = [];

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashedPassword, role: role || 'student' };
  users.push(user);
  res.json({ message: 'User registered successfully' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get('/api/users', authenticate, authorize('admin'), (req, res) => {
  res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

app.get('/api/submissions', authenticate, (req, res) => {
  let filtered = submissions;
  if (req.user.role === 'student') {
    filtered = submissions.filter(s => s.studentId === req.user.id);
  } else if (req.user.role === 'mentor') {
    filtered = submissions.filter(s => s.status === 'pending' || s.mentorId === req.user.id);
  }
  res.json(filtered.map(s => ({
    ...s,
    student: users.find(u => u.id === s.studentId),
    mentor: users.find(u => u.id === s.mentorId)
  })));
});

app.post('/api/submissions', authenticate, authorize('student'), upload.single('file'), (req, res) => {
  const submission = {
    id: uuidv4(),
    studentId: req.user.id,
    title: req.body.title,
    description: req.body.description,
    filePath: req.file ? `/uploads/${req.file.filename}` : null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  submissions.push(submission);
  res.json(submission);
});

app.get('/api/submissions/:id', authenticate, (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (req.user.role === 'student' && submission.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({
    ...submission,
    student: users.find(u => u.id === submission.studentId),
    reviews: reviews.filter(r => r.submissionId === submission.id).map(r => ({
      ...r,
      mentor: users.find(u => u.id === r.mentorId)
    }))
  });
});

app.put('/api/submissions/:id', authenticate, authorize('mentor', 'admin'), (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'needs_revision'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  submission.status = status;
  submission.updatedAt = new Date().toISOString();
  res.json(submission);
});

app.post('/api/reviews', authenticate, authorize('mentor'), (req, res) => {
  const { submissionId, feedback, rating } = req.body;
  const submission = submissions.find(s => s.id === submissionId);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  const review = {
    id: uuidv4(),
    submissionId,
    mentorId: req.user.id,
    feedback,
    rating,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  res.json(review);
});

app.get('/api/reviews/:submissionId', authenticate, (req, res) => {
  const submission = submissions.find(s => s.id === req.params.submissionId);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (req.user.role === 'student' && submission.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(reviews.filter(r => r.submissionId === req.params.submissionId).map(r => ({
    ...r,
    mentor: users.find(u => u.id === r.mentorId)
  })));
});

app.get('/api/stats', authenticate, authorize('admin'), (req, res) => {
  const totalSubmissions = submissions.length;
  const pending = submissions.filter(s => s.status === 'pending').length;
  const approved = submissions.filter(s => s.status === 'approved').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  const needsRevision = submissions.filter(s => s.status === 'needs_revision').length;
  res.json({ totalSubmissions, pending, approved, rejected, needsRevision, totalUsers: users.length });
});

const demoUsers = async () => {
  const demoPassword = await bcrypt.hash('123', 10);
  users.push(
    { id: uuidv4(), name: 'Demo Student', email: 'student@demo.com', password: demoPassword, role: 'student' },
    { id: uuidv4(), name: 'Demo Mentor', email: 'mentor@demo.com', password: demoPassword, role: 'mentor' },
    { id: uuidv4(), name: 'Demo Admin', email: 'admin@demo.com', password: demoPassword, role: 'admin' }
  );
};

demoUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Demo credentials:');
    console.log('  Student: student@demo.com / 123');
    console.log('  Mentor: mentor@demo.com / 123');
    console.log('  Admin: admin@demo.com / 123');
  });
});