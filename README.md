# Submission Review and Feedback System

A web application where students upload work, mentors review submissions, and feedback is tracked in a structured workflow.

## Features

### Student Role
- Upload submissions (PDF, images, text)
- View submission status (Pending, Approved, Rejected, Needs Revision)
- Receive feedback from mentors
- Track submission history

### Mentor Role
- View all pending submissions
- Review and approve/reject submissions
- Add feedback and comments
- Set deadlines for revisions

### Admin Role
- Manage users (students, mentors)
- View all submissions and statistics
- Manage system settings

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (or SQLite for demo)
- **File Storage:** Local storage (can extend to S3)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or download the project
cd submission-system

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Project Structure

```
submission-system/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
├── server/           # Node.js backend
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── index.js
├── README.md
└── package.json
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Submissions
- GET /api/submissions - List all submissions
- POST /api/submissions - Create submission
- GET /api/submissions/:id - Get submission details
- PUT /api/submissions/:id - Update submission
- DELETE /api/submissions/:id - Delete submission

### Reviews
- POST /api/reviews - Add review
- GET /api/reviews/:submissionId - Get reviews for submission

## User Roles
- `student` - Can upload and view own submissions
- `mentor` - Can review and provide feedback
- `admin` - Full access

## Demo Credentials

```
Student: student@demo.com / password123
Mentor: mentor@demo.com / password123
Admin: admin@demo.com / password123
```

## Screenshots

[Add screenshots here]

## License

MIT