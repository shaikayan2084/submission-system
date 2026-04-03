import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, CheckCircle, XCircle, Clock, Star, LogOut, Users, LayoutDashboard, Send } from 'lucide-react';

const AuthContext = createContext(null);

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function Login() {
  const [email, setEmail] = useState('student@demo.com');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-2">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-6">Sign in to continue</p>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
            Sign In
          </button>
        </form>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2 font-medium">Demo Credentials:</p>
          <p className="text-xs text-gray-500">Student: student@demo.com / 123</p>
          <p className="text-xs text-gray-500">Mentor: mentor@demo.com / 123</p>
          <p className="text-xs text-gray-500">Admin: admin@demo.com / 123</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Submission System</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.name} ({user.role})</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {user.role === 'student' && <StudentDashboard />}
        {user.role === 'mentor' && <MentorDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}

function StudentDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    const res = await api.get('/submissions');
    setSubmissions(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    if (file) data.append('file', file);
    await api.post('/submissions', data);
    setShowForm(false);
    setFormData({ title: '', description: '' });
    setFile(null);
    loadSubmissions();
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    needs_revision: 'bg-orange-100 text-orange-800'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Submissions</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Upload size={20} /> New Submission
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Submit New Work</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" rows="3" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">File (optional)</label>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Submit</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="grid gap-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{sub.title}</h3>
                <p className="text-gray-500 mt-1">{sub.description}</p>
                <p className="text-sm text-gray-400 mt-2">Submitted: {new Date(sub.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[sub.status]}`}>
                {sub.status.replace('_', ' ')}
              </span>
            </div>
            {sub.reviews?.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Feedback</h4>
                {sub.reviews.map((review) => (
                  <div key={review.id} className="text-sm text-gray-600">
                    <p>{review.feedback}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="text-yellow-500" />
                      <span>{review.rating}/5</span>
                      <span className="text-gray-400">- {review.mentor?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && <p className="text-gray-500 text-center py-8">No submissions yet</p>}
      </div>
    </div>
  );
}

function MentorDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    const res = await api.get('/submissions');
    setSubmissions(res.data);
  };

  const handleReview = async (status) => {
    await api.put(`/submissions/${selected.id}`, { status });
    if (feedback) {
      await api.post('/reviews', { submissionId: selected.id, feedback, rating });
    }
    setSelected(null);
    setFeedback('');
    setRating(5);
    loadSubmissions();
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    needs_revision: 'bg-orange-100 text-orange-800'
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Submissions to Review</h2>
      <div className="grid gap-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{sub.title}</h3>
                <p className="text-gray-500 mt-1">{sub.description}</p>
                <p className="text-sm text-gray-400 mt-2">By: {sub.student?.name} | {new Date(sub.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[sub.status]}`}>
                  {sub.status.replace('_', ' ')}
                </span>
                {sub.status === 'pending' && (
                  <button onClick={() => setSelected(sub)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-700">
                    Review
                  </button>
                )}
              </div>
            </div>
            {sub.reviews?.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Previous Reviews</h4>
                {sub.reviews.map((review) => (
                  <div key={review.id} className="text-sm text-gray-600">
                    <p>{review.feedback}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="text-yellow-500" />
                      <span>{review.rating}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && <p className="text-gray-500 text-center py-8">No submissions</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Review: {selected.title}</h3>
            <p className="text-gray-600 mb-4">{selected.description}</p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Feedback</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg" rows="3" placeholder="Provide feedback..." />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rating</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleReview('approved')} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                <CheckCircle size={20} /> Approve
              </button>
              <button onClick={() => handleReview('needs_revision')} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2">
                <Clock size={20} /> Needs Revision
              </button>
              <button onClick={() => handleReview('rejected')} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
                <XCircle size={20} /> Reject
              </button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-2 text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usersRes, statsRes, subsRes] = await Promise.all([
      api.get('/users'),
      api.get('/stats'),
      api.get('/submissions')
    ]);
    setUsers(usersRes.data);
    setStats(statsRes.data);
    setSubmissions(subsRes.data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
      
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Total Submissions</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalSubmissions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalUsers}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} /> Users ({users.length})
          </h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span>{user.name}</span>
                <span className="text-sm text-gray-500">{user.email}</span>
                <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'mentor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} /> Recent Submissions
          </h3>
          <div className="space-y-2">
            {submissions.slice(0, 5).map((sub) => (
              <div key={sub.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="truncate">{sub.title}</span>
                <span className="text-xs text-gray-500">{sub.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;