const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data store
const users = [
  { id: '1', name: 'John Student', email: 'student@demo.com', password: '123', role: 'student' },
  { id: '2', name: 'Jane Mentor', email: 'mentor@demo.com', password: '123', role: 'mentor' },
  { id: '3', name: 'Admin User', email: 'admin@demo.com', password: '123', role: 'admin' }
];

const submissions = [
  {
    id: 'sub1',
    studentId: '1',
    title: 'Math Assignment 1',
    description: 'Completed algebra problems',
    fileUrl: '/files/assignment1.pdf',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    deadline: '2024-01-20T23:59:59Z'
  },
  {
    id: 'sub2',
    studentId: '1',
    title: 'Science Project',
    description: 'Science fair project on solar energy',
    fileUrl: '/files/project.pdf',
    status: 'approved',
    createdAt: '2024-01-10T10:00:00Z',
    deadline: '2024-01-15T23:59:59Z'
  }
];

const reviews = [
  {
    id: 'rev1',
    submissionId: 'sub2',
    mentorId: '2',
    comment: 'Great work! Well done.',
    rating: 5,
    createdAt: '2024-01-12T10:00:00Z'
  }
];

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['user-id'];
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// Submission Routes
app.get('/api/submissions', (req, res) => {
  const userId = req.headers['user-id'];
  const user = users.find(u => u.id === userId);
  
  let result;
  if (user?.role === 'student') {
    result = submissions.filter(s => s.studentId === userId);
  } else {
    result = submissions;
  }
  
  res.json(result);
});

app.get('/api/submissions/:id', (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  const submissionReviews = reviews.filter(r => r.submissionId === submission.id);
  res.json({ ...submission, reviews: submissionReviews });
});

app.post('/api/submissions', (req, res) => {
  const userId = req.headers['user-id'];
  const { title, description, deadline } = req.body;
  
  const newSubmission = {
    id: uuidv4(),
    studentId: userId,
    title,
    description,
    fileUrl: '/files/uploaded.pdf',
    status: 'pending',
    createdAt: new Date().toISOString(),
    deadline: deadline || null
  };
  
  submissions.push(newSubmission);
  res.status(201).json(newSubmission);
});

app.put('/api/submissions/:id', (req, res) => {
  const { status } = req.body;
  const submission = submissions.find(s => s.id === req.params.id);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  submission.status = status;
  res.json(submission);
});

// Review Routes
app.post('/api/reviews', (req, res) => {
  const userId = req.headers['user-id'];
  const { submissionId, comment, rating } = req.body;
  
  const newReview = {
    id: uuidv4(),
    submissionId,
    mentorId: userId,
    comment,
    rating,
    createdAt: new Date().toISOString()
  };
  
  reviews.push(newReview);
  
  // Update submission status
  const submission = submissions.find(s => s.id === submissionId);
  if (submission) {
    submission.status = rating >= 3 ? 'approved' : 'rejected';
  }
  
  res.status(201).json(newReview);
});

app.get('/api/reviews/:submissionId', (req, res) => {
  const submissionReviews = reviews.filter(r => r.submissionId === req.params.submissionId);
  res.json(submissionReviews);
});

// Stats
app.get('/api/stats', (req, res) => {
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  };
  res.json(stats);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});