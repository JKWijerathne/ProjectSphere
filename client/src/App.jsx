import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getStoredAuth = () => {
  const authValue = localStorage.getItem('projectsphere_auth');

  if (authValue) {
    try {
      const parsed = JSON.parse(authValue);
      if (parsed?.token) return parsed;
    } catch {
      if (authValue.split('.').length === 3) return { token: authValue, user: null };
    }
  }

  const token = (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('projectsphere_token')
  );

  return token ? { token, user: null } : { token: null, user: null };
};

const saveAuth = ({ token, user }) => {
  localStorage.setItem('projectsphere_auth', JSON.stringify({ token, user }));
  localStorage.setItem('token', token);
};

const clearAuth = () => {
  localStorage.removeItem('projectsphere_auth');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('projectsphere_token');
};

const formatTimeAgo = (dateValue) => {
  const date = new Date(dateValue);
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

const notificationTone = {
  ProjectLiked: { icon: 'L', label: 'Project liked' },
  ProjectApproved: { icon: 'OK', label: 'Approved' },
  ProjectRejected: { icon: '!', label: 'Needs attention' },
  ProjectCommented: { icon: 'C', label: 'Comment' },
  ProjectCreated: { icon: '+', label: 'New project' },
  UserFollowed: { icon: 'F', label: 'New follower' },
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function NotificationCenter({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  const headers = useMemo(() => authHeaders(token), [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/notifications', { headers });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }, [headers, token]);

  useEffect(() => {
    const initialFetchId = window.setTimeout(fetchNotifications, 0);

    if (!token) {
      return () => window.clearTimeout(initialFetchId);
    }

    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => {
      window.clearTimeout(initialFetchId);
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications, token]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      const data = await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers,
      });

      setNotifications((current) => current.map((notification) => (
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      )));
      setUnreadCount(data.unreadCount || 0);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    try {
      await apiRequest('/api/notifications/read-all', {
        method: 'PUT',
        headers,
      });

      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        className="icon-button notification-trigger"
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setIsOpen((current) => !current);
          fetchNotifications();
        }}
      >
        <span className="bell-icon">N</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <section className="notification-panel" aria-label="Notification center">
          <div className="notification-panel__header">
            <div>
              <p className="eyebrow">Notification center</p>
              <h2>Updates</h2>
            </div>
            <button className="text-button" type="button" onClick={markAllAsRead} disabled={!token || unreadCount === 0}>
              Mark all read
            </button>
          </div>

          {!token && (
            <div className="notification-state">
              <strong>Sign in to see notifications</strong>
              <span>Likes, approvals, comments, and follow activity will appear here.</span>
            </div>
          )}

          {token && error && (
            <div className="notification-state notification-state--error">
              <strong>Could not load notifications</strong>
              <span>{error}</span>
            </div>
          )}

          {token && !error && (
            <div className="notification-list">
              {isLoading && notifications.length === 0 && (
                <div className="notification-state">
                  <strong>Loading notifications</strong>
                  <span>Checking your latest project activity.</span>
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="notification-state">
                  <strong>No notifications yet</strong>
                  <span>Project likes, approvals, rejections, and comments will show up here.</span>
                </div>
              )}

              {notifications.map((notification) => {
                const tone = notificationTone[notification.type] || { icon: 'U', label: 'Update' };

                return (
                  <button
                    className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`}
                    key={notification._id}
                    type="button"
                    onClick={() => markAsRead(notification._id)}
                  >
                    <span className="notification-item__icon">{tone.icon}</span>
                    <span className="notification-item__body">
                      <span className="notification-item__meta">
                        <span>{tone.label}</span>
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                      </span>
                      <span className="notification-item__message">{notification.message}</span>
                      {notification.relatedProject?.title && (
                        <span className="notification-item__project">{notification.relatedProject.title}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Navbar({ auth, onLogout }) {
  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark">PS</span>
        <span>
          <strong>ProjectSphere</strong>
          <small>Student project network</small>
        </span>
      </Link>

      <nav className="nav-links" aria-label="Main navigation">
        <Link to="/">Home</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/lecturer/dashboard">Lecturer dashboard</Link>
        {!auth.token && <Link to="/login">Login</Link>}
      </nav>

      <div className="header-actions">
        {auth.user?.name && <span className="session-name">{auth.user.name}</span>}
        {auth.token && (
          <button className="text-button" type="button" onClick={onLogout}>
            Logout
          </button>
        )}
        <NotificationCenter token={auth.token} />
      </div>
    </header>
  );
}

function ProjectCard({ project, action }) {
  return (
    <article className="project-card">
      <div>
        <p className="project-card__status">{project.status}</p>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
      <div className="project-card__meta">
        <span>Owner: {project.owner?.name || 'Student'}</span>
        {project.approvedAt && <span>Approved {new Date(project.approvedAt).toLocaleDateString()}</span>}
      </div>
      {Array.isArray(project.technologies) && project.technologies.length > 0 && (
        <div className="tag-row">
          {project.technologies.slice(0, 5).map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
      )}
      {action}
    </article>
  );
}

function LecturerDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingProjects, setPendingProjects] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const headers = useMemo(() => authHeaders(token), [token]);

  const loadProjects = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const [pendingData, approvedData] = await Promise.all([
        apiRequest('/api/admin/projects/pending', { headers }),
        apiRequest('/api/admin/projects/approved', { headers }),
      ]);

      setPendingProjects(pendingData.projects || []);
      setApprovedProjects(approvedData.projects || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [headers, token]);

  useEffect(() => {
    const loadId = window.setTimeout(loadProjects, 0);
    return () => window.clearTimeout(loadId);
  }, [loadProjects]);

  const approveProject = async (projectId) => {
    setMessage('');
    setError('');

    try {
      await apiRequest(`/api/admin/projects/${projectId}/approve`, {
        method: 'PUT',
        headers,
      });
      setMessage('Project approved and moved to Approved projects.');
      setActiveTab('approved');
      await loadProjects();
    } catch (approveError) {
      setError(approveError.message);
    }
  };

  if (!token) {
    return (
      <section className="simple-page">
        <h1>Lecturer dashboard</h1>
        <p>Please login as a lecturer to review pending projects and view projects you approved.</p>
        <Link className="primary-link" to="/login">Login</Link>
      </section>
    );
  }

  const visibleProjects = activeTab === 'pending' ? pendingProjects : approvedProjects;

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Lecturer workspace</p>
          <h1>Project review dashboard</h1>
          <p>Review submitted projects and track the projects you personally approved.</p>
        </div>
        <button className="secondary-button" type="button" onClick={loadProjects}>
          Refresh
        </button>
      </div>

      <div className="tab-bar" role="tablist" aria-label="Project review tabs">
        <button
          className={activeTab === 'pending' ? 'tab-button tab-button--active' : 'tab-button'}
          type="button"
          onClick={() => setActiveTab('pending')}
        >
          Pending projects
          <span>{pendingProjects.length}</span>
        </button>
        <button
          className={activeTab === 'approved' ? 'tab-button tab-button--active' : 'tab-button'}
          type="button"
          onClick={() => setActiveTab('approved')}
        >
          Approved projects
          <span>{approvedProjects.length}</span>
        </button>
      </div>

      {message && <div className="form-status form-status--success">{message}</div>}
      {error && <div className="form-status form-status--error">{error}</div>}

      {isLoading && <div className="empty-panel">Loading projects...</div>}

      {!isLoading && visibleProjects.length === 0 && (
        <div className="empty-panel">
          {activeTab === 'pending'
            ? 'No pending projects are waiting for review.'
            : 'No projects have been approved by this lecturer yet.'}
        </div>
      )}

      {!isLoading && visibleProjects.length > 0 && (
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              action={activeTab === 'pending' && (
                <button className="primary-link project-action" type="button" onClick={() => approveProject(project._id)}>
                  Approve project
                </button>
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Login({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      saveAuth({ token: data.token, user: data.user });
      onAuth({ token: data.token, user: data.user });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateForm} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateForm} required />
        </label>
        {error && <div className="form-status form-status--error">{error}</div>}
        <button className="primary-link" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
        <p className="form-note">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </section>
  );
}

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Lecturer',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiRequest('/api/otp/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage(data.message || 'Verification code sent to your email.');
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
        <label>
          Name
          <input name="name" type="text" value={form.name} onChange={updateForm} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateForm} required />
        </label>
        <label>
          Role
          <select name="role" value={form.role} onChange={updateForm}>
            <option value="Lecturer">Lecturer</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Student">Student</option>
          </select>
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateForm} required />
        </label>
        <label>
          Confirm password
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateForm} required />
        </label>
        {message && <div className="form-status form-status--success">{message}</div>}
        {error && <div className="form-status form-status--error">{error}</div>}
        <button className="primary-link" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending OTP...' : 'Register'}
        </button>
      </form>
    </section>
  );
}

const Home = () => (
  <section className="page-section">
    <div>
      <p className="eyebrow">Project activity</p>
      <h1>Stay close to every project update.</h1>
      <p>
        The notification center keeps students and lecturers informed when projects receive likes,
        comments, approvals, or review decisions.
      </p>
      <div className="hero-actions">
        <Link className="primary-link" to="/projects">Browse projects</Link>
        <Link className="secondary-link" to="/lecturer/dashboard">Lecturer dashboard</Link>
      </div>
    </div>
  </section>
);

const ProjectList = () => (
  <section className="simple-page">
    <h1>Projects</h1>
    <p>Approved projects and engagement activity connect back to the notification center.</p>
  </section>
);

const NotFound = () => (
  <section className="simple-page">
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
  </section>
);

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const handleLogout = () => {
    clearAuth();
    setAuth({ token: null, user: null });
  };

  return (
    <Router>
      <div className="app-shell">
        <Navbar auth={auth} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onAuth={setAuth} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/lecturer/dashboard" element={<LecturerDashboard token={auth.token} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
