const { useState, useEffect } = React;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
const API_BASE = '';  // Same origin: Django serves both API and frontend

const getAccessToken  = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const saveTokens = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAccessToken()}`,
});

// Map a backend Event object to the shape expected by the UI
const normalizeEvent = (ev) => {
    const startDt   = ev.start_date ? new Date(ev.start_date) : null;
    const dateStr   = startDt ? startDt.toISOString().split('T')[0] : '';
    const timeStr   = startDt
        ? startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '';
    const location  = [ev.building, ev.floor ? `Floor ${ev.floor}` : null, ev.room]
        .filter(Boolean).join(', ') || ev.organizer_side || '';
    return {
        id:              ev.id,
        title:           ev.title,
        description:     ev.desc || '',
        date:            dateStr,
        time:            timeStr,
        location:        location,
        type:            ev.visibility || 'public',
        participants:    ev.participant_count || 0,
        maxParticipants: ev.max_participants  || 0,
        agenda:          (ev.agendas || []).map(a => a.action),
    };
};

// ---------------------------------------------------------------------------
// App component
// ---------------------------------------------------------------------------
function App() {
    const [currentUser, setCurrentUser]           = useState(null);
    const [currentPage, setCurrentPage]           = useState('home');
    const [events, setEvents]                     = useState([]);
    const [filter, setFilter]                     = useState('all');
    const [selectedEvent, setSelectedEvent]       = useState(null);
    const [showModal, setShowModal]               = useState(false);
    const [showCreateModal, setShowCreateModal]   = useState(false);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [authPage, setAuthPage]                 = useState('login');
    const [pendingUser, setPendingUser]           = useState(null);

    // Restore session on page load
    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            const stored = localStorage.getItem('current_user');
            if (stored) {
                setCurrentUser(JSON.parse(stored));
                setCurrentPage('events');
            }
        }
    }, []);

    // Fetch events whenever the user logs in
    useEffect(() => {
        if (currentUser) fetchEvents();
    }, [currentUser]);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/events/`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setEvents(data.map(normalizeEvent));
            }
        } catch (err) {
            console.error('Failed to load events:', err);
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/api/login/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username, password }),
            });
            if (res.ok) {
                const data = await res.json();
                saveTokens(data.tokens.access, data.tokens.refresh);
                const user = { name: username, username, role: data.is_staff ? 'admin' : 'student' };
                localStorage.setItem('current_user', JSON.stringify(user));
                setCurrentUser(user);
                setCurrentPage('events');
                return true;
            }
        } catch (err) {
            console.error('Login error:', err);
        }
        return false;
    };

    const handleRegisterOtp = async (userData) => {
        try {
            const res = await fetch(`${API_BASE}/api/register/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    username: userData.username,
                    email:    userData.email,
                    phone:    userData.phone,
                    password: userData.password,
                }),
            });
            if (res.ok) {
                setPendingUser({
                    email:    userData.email,
                    name:     userData.username,
                    username: userData.username,
                    phone:    userData.phone,
                    password: userData.password,
                });
                setAuthPage('register-otp');
                return { success: true };
            }
            const errData = await res.json();
            return { success: false, errors: errData };
        } catch (err) {
            console.error('Register error:', err);
            return { success: false, errors: { non_field_errors: ['Network error. Please try again.'] } };
        }
    };

    const handleRegisterComplete = async (otp) => {        try {
            const res = await fetch(`${API_BASE}/api/verify-otp/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: pendingUser.email, otp }),
            });
            if (res.ok) {
                const data = await res.json();
                saveTokens(data.tokens.access, data.tokens.refresh);
                const user = { name: pendingUser.username, username: pendingUser.username, role: 'student' };
                localStorage.setItem('current_user', JSON.stringify(user));
                setCurrentUser(user);
                setCurrentPage('events');
                setPendingUser(null);
                return true;
            }
        } catch (err) {
            console.error('OTP verify error:', err);
        }
        return false;
    };

    const handleResendOtp = async () => {
        if (!pendingUser) return { success: false };
        try {
            const res = await fetch(`${API_BASE}/api/register/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    username: pendingUser.username,
                    email:    pendingUser.email,
                    phone:    pendingUser.phone,
                    password: pendingUser.password,
                }),
            });
            return { success: res.ok };
        } catch (err) {
            console.error('Resend OTP error:', err);
            return { success: false };
        }
    };

    const handleLogout = async () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                await fetch(`${API_BASE}/api/logout/`, {
                    method:  'POST',
                    headers: authHeaders(),
                    body:    JSON.stringify({ refresh: refreshToken }),
                });
            } catch (err) { /* ignore */ }
        }
        clearTokens();
        localStorage.removeItem('current_user');
        setCurrentUser(null);
        setCurrentPage('home');
        setAuthPage('login');
        setPendingUser(null);
        setRegisteredEvents([]);
        setEvents([]);
    };

    const handleEventRegister = async (eventId) => {
        if (registeredEvents.includes(eventId)) return;
        try {
            const res = await fetch(`${API_BASE}/api/allowed-participants/`, {
                method:  'POST',
                headers: authHeaders(),
                body:    JSON.stringify({ event: eventId }),
            });
            if (res.ok) {
                setRegisteredEvents([...registeredEvents, eventId]);
                setEvents(events.map(e => e.id === eventId ? { ...e, participants: e.participants + 1 } : e));
            }
        } catch (err) {
            console.error('Register for event error:', err);
        }
    };

    const handleUnregister = (eventId) => {
        // Optimistically remove from local state; counts re-sync on next fetchEvents
        setRegisteredEvents(registeredEvents.filter(id => id !== eventId));
        setEvents(events.map(e => e.id === eventId ? { ...e, participants: Math.max(0, e.participants - 1) } : e));
    };

    const handleCreateEvent = async (formData) => {
        try {
            const start_date = formData.date && formData.time
                ? `${formData.date}T${formData.time}:00`
                : formData.date;
            const res = await fetch(`${API_BASE}/api/events/`, {
                method:  'POST',
                headers: authHeaders(),
                body:    JSON.stringify({
                    title:            formData.title,
                    desc:             formData.description,
                    type:             'offline',
                    visibility:       formData.type,
                    start_date,
                    room:             formData.location,
                    max_participants: parseInt(formData.maxParticipants, 10) || null,
                }),
            });
            if (res.ok) {
                const newEvent = await res.json();
                setEvents([normalizeEvent(newEvent), ...events]);
                setShowCreateModal(false);
            }
        } catch (err) {
            console.error('Create event error:', err);
        }
    };

    const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

    return (
        <div className="app-container">
            {currentUser && (
                <Navbar currentUser={currentUser} currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
            )}
            {!currentUser ? (
                authPage === 'login'
                    ? <LoginPage onLogin={handleLogin} onForgotPassword={() => setAuthPage('forgot')} onRegisterOtp={handleRegisterOtp} />
                : authPage === 'forgot'
                    ? <ForgotPasswordPage onBack={() => setAuthPage('login')} />
                : authPage === 'register-otp'
                    ? <RegisterOtpPage email={pendingUser?.email} onVerified={handleRegisterComplete} onResend={handleResendOtp} onBack={() => setAuthPage('login')} />
                : null
            ) : (
                <div className="main-content">
                    {currentPage === 'events' && (
                        <EventsPage
                            events={filteredEvents} filter={filter} setFilter={setFilter}
                            currentUser={currentUser} registeredEvents={registeredEvents}
                            onRegister={handleEventRegister} onUnregister={handleUnregister}
                            onEventClick={(event) => { setSelectedEvent(event); setShowModal(true); }}
                            onCreateClick={() => setShowCreateModal(true)}
                        />
                    )}
                    {currentPage === 'calendar' && <CalendarPage events={events} />}
                    {currentPage === 'admin' && currentUser.role === 'admin' && <AdminPage events={events} users={currentUser ? [currentUser] : []} />}
                    {showModal && selectedEvent && (
                        <EventModal
                            event={selectedEvent}
                            isRegistered={registeredEvents.includes(selectedEvent.id)}
                            onClose={() => setShowModal(false)}
                            onRegister={() => { handleEventRegister(selectedEvent.id); setShowModal(false); }}
                            onUnregister={() => { handleUnregister(selectedEvent.id); setShowModal(false); }}
                        />
                    )}
                    {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateEvent} />}
                </div>
            )}
        </div>
    );
}


function Navbar({ currentUser, currentPage, setCurrentPage, onLogout }) {
    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="logo">LINKEVENT</div>
                <div className="nav-menu">
                    <button className={`nav-btn ${currentPage === 'events'   ? 'active' : ''}`} onClick={() => setCurrentPage('events')}>Events</button>
                    <button className={`nav-btn ${currentPage === 'calendar' ? 'active' : ''}`} onClick={() => setCurrentPage('calendar')}>Calendar</button>
                    {currentUser.role === 'admin' && (
                        <button className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => setCurrentPage('admin')}>Admin Panel</button>
                    )}
                    <button className="nav-btn btn-logout" onClick={onLogout}>Logout ({currentUser.name})</button>
                </div>
            </div>
        </nav>
    );
}


function LoginPage({ onLogin, onForgotPassword, onRegisterOtp }) {
    const [isRegister, setIsRegister]           = useState(false);
    const [username, setUsername]               = useState('');
    const [email, setEmail]                     = useState('');
    const [phone, setPhone]                     = useState('');
    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass]               = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [error, setError]                     = useState('');
    const [loading, setLoading]                 = useState(false);

    const getStrength = (p) => {
        let s = 0;
        if (p.length >= 8)           s++;
        if (/[A-Z]/.test(p))         s++;
        if (/[0-9]/.test(p))         s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', '#e94560', '#f39c12', '#3498db', '#2ecc71'];
    const strength = getStrength(password);

    const switchMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setUsername('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setShowPass(false);
        setShowConfirm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isRegister) {
            if (!username.trim())            { setError('Please enter a username'); return; }
            if (!phone.trim())               { setError('Please enter your phone number'); return; }
            if (password.length < 8)         { setError('Password must be at least 8 characters'); return; }
            if (password !== confirmPassword) { setError('Passwords do not match'); return; }
            setLoading(true);
            const result = await onRegisterOtp({ username, email, phone, password });
            setLoading(false);
            if (!result.success) {
                const msgs = Object.values(result.errors || {}).flat();
                setError(msgs.length ? msgs[0] : 'Registration failed. Please try again.');
            }
        } else {
            setLoading(true);
            const success = await onLogin(username, password);
            setLoading(false);
            if (!success) setError('Invalid username or password');
        }
    };

    const AuthVisual = () => (
        <div className="auth-visual">
            <div className="auth-visual-content">
                <h3>Join Our Community</h3>
                <p>Connect with thousands of students and faculty members through organized campus events</p>
                <div className="auth-visual-features">
                    <div className="auth-feature-item">
                        <div className="auth-feature-icon">🎯</div>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Public & Private Events</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Access both open and exclusive events</div>
                        </div>
                    </div>
                    <div className="auth-feature-item">
                        <div className="auth-feature-icon">📊</div>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Real-Time Updates</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Get instant notifications and reminders</div>
                        </div>
                    </div>
                    <div className="auth-feature-item">
                        <div className="auth-feature-icon">👥</div>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Networking Opportunities</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Connect with peers and faculty</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="main-content">
            <div className="hero">
                <div className="hero-content">
                    <h1>Welcome to LINKEVENT</h1>
                    <p>Your centralized platform for planning, managing, and participating in all university events. Streamline event organization with secure registration and real-time updates.</p>
                    <div className="hero-features">
                        <div className="hero-feature"><div className="hero-feature-icon">📅</div><span>Easy Event Creation</span></div>
                        <div className="hero-feature"><div className="hero-feature-icon">🔒</div><span>Secure Registration</span></div>
                        <div className="hero-feature"><div className="hero-feature-icon">📧</div><span>Smart Notifications</span></div>
                    </div>
                </div>
            </div>

            <div className="auth-container">
                <AuthVisual />

                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
                        <p>{isRegister ? 'Register with your university email' : 'Use your university email to continue'}</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>

                        {/* Username — always shown */}
                        <div className="form-group">
                        <label className="form-label">Username</label>
                            <input
                                type="text" className="form-input"
                                placeholder={isRegister ? 'Choose a username' : 'Enter your username'}
                                value={username} onChange={(e) => setUsername(e.target.value)}
                                required disabled={loading}
                            />
                        </div>

                        {/* University Email — only on register */}
                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">University Email</label>
                                <input
                                    type="email" className="form-input"
                                    placeholder="your@beu.edu.az"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    required disabled={loading}
                                />
                            </div>
                        )}

                        {/* Phone — only on register */}
                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel" className="form-input"
                                    placeholder="+994XXXXXXXXX"
                                    value={phone} onChange={(e) => setPhone(e.target.value)}
                                    required disabled={loading}
                                />
                            </div>
                        )}

                        {/* Password with show/hide toggle */}
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'} className="form-input"
                                    placeholder={isRegister ? 'Minimum 8 characters' : 'Enter your password'}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    required disabled={loading}
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999' }}>
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>

                            {/* Strength bar — only on register */}
                            {isRegister && password.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: '0.25rem' }}>
                                        {[1,2,3,4].map(i => (
                                            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColor[strength] : '#e0e0e0', transition: 'background 0.3s' }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: strengthColor[strength], fontWeight: 600 }}>{strengthLabel[strength]}</span>
                                </div>
                            )}
                        </div>

                        {/* Confirm password — only on register */}
                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'} className="form-input"
                                        placeholder="Repeat your password"
                                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        required disabled={loading}
                                        style={{ paddingRight: '3rem', borderColor: confirmPassword ? (confirmPassword === password ? '#2ecc71' : '#e94560') : undefined }}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999' }}>
                                        {showConfirm ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <div style={{ fontSize: '0.85rem', color: '#e94560', marginTop: '0.4rem' }}>Passwords do not match</div>
                                )}
                                {confirmPassword && confirmPassword === password && (
                                    <div style={{ fontSize: '0.85rem', color: '#2ecc71', marginTop: '0.4rem' }}>✓ Passwords match</div>
                                )}
                            </div>
                        )}

                        {/* Forgot password — only on login */}
                        {!isRegister && (
                            <div style={{ textAlign: 'right', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
                                <a className="auth-link" onClick={onForgotPassword} style={{ fontSize: '0.9rem' }}>Forgot password?</a>
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    <div className="auth-switch">
                        {isRegister ? "Already have an account? " : "Don't have an account? "}
                        <a className="auth-link" onClick={switchMode}>{isRegister ? 'Sign In' : 'Register'}</a>
                    </div>

                    {isRegister && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(102,126,234,0.05)', borderRadius: '12px', fontSize: '0.88rem', border: '1px solid rgba(102,126,234,0.15)', color: '#666' }}>
                            ℹ️ Registration requires a university email (<strong>@beu.edu.az</strong> or <strong>@std.beu.edu.az</strong>). A 6-digit OTP will be sent to verify your address.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function ForgotPasswordPage({ onBack }) {
    const [step, setStep]                       = useState('email');
    const [email, setEmail]                     = useState('');
    const [code, setCode]                       = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew]                 = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [error, setError]                     = useState('');
    const [loading, setLoading]                 = useState(false);
    const [resendTimer, setResendTimer]         = useState(0);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setInterval(() => setResendTimer(n => n - 1), 1000);
        return () => clearInterval(t);
    }, [resendTimer]);

    const getStrength = (p) => {
        let s = 0;
        if (p.length >= 8)           s++;
        if (/[A-Z]/.test(p))         s++;
        if (/[0-9]/.test(p))         s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', '#e94560', '#f39c12', '#3498db', '#2ecc71'];
    const strength = getStrength(newPassword);

    const handleSendCode = async (e) => {
        e.preventDefault(); setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/forgot-password/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email }),
            });
            if (res.ok) {
                setStep('code'); setResendTimer(60);
            } else {
                const data = await res.json();
                setError(Object.values(data).flat()[0] || 'Failed to send code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    const handleVerifyCode = (e) => {
        e.preventDefault(); setError('');
        if (code.join('').length < 6) { setError('Please enter the full 6-digit code'); return; }
        setStep('newpass');
    };

    const handleResetPassword = async (e) => {
        e.preventDefault(); setError('');
        if (newPassword.length < 8)          { setError('Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword)  { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/reset-password/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, otp: code.join(''), new_password: newPassword }),
            });
            if (res.ok) {
                setStep('done');
            } else {
                const data = await res.json();
                setError(Object.values(data).flat()[0] || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    const handleCodeChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const updated = [...code]; updated[idx] = val; setCode(updated);
        if (val && idx < 5) document.getElementById(`rc-${idx + 1}`)?.focus();
    };
    const handleCodeKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) document.getElementById(`rc-${idx - 1}`)?.focus();
    };
    const handleResend = () => {
        if (resendTimer > 0) return;
        setCode(['', '', '', '', '', '']); setError(''); setResendTimer(60);
    };

    const stepKeys = ['email', 'code', 'newpass'];

    return (
        <div className="main-content">
            <div className="hero">
                <div className="hero-content">
                    <h1>Welcome to LINKEVENT</h1>
                    <p>Your centralized platform for planning, managing, and participating in all university events.</p>
                    <div className="hero-features">
                        <div className="hero-feature"><div className="hero-feature-icon">📅</div><span>Easy Event Creation</span></div>
                        <div className="hero-feature"><div className="hero-feature-icon">🔒</div><span>Secure Registration</span></div>
                        <div className="hero-feature"><div className="hero-feature-icon">📧</div><span>Smart Notifications</span></div>
                    </div>
                </div>
            </div>

            <div className="auth-container">
                <div className="auth-visual" style={{ background: 'linear-gradient(135deg,#2b5876,#4e4376)' }}>
                    <div className="auth-visual-content">
                        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🔑</div>
                        <h3>Reset Your Password</h3>
                        <p>We will send a verification code to your university email so you can create a new password safely.</p>
                        <div className="auth-visual-features" style={{ marginTop: '2rem' }}>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">📧</div>
                                <div><div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Check Your Email</div><div style={{ fontSize: '0.9rem', opacity: 0.85 }}>A 6-digit code will be sent</div></div>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">⏱️</div>
                                <div><div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Code Expires in 10 min</div><div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Request a new one if needed</div></div>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">🛡️</div>
                                <div><div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Secure Reset</div><div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Your account stays protected</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-container">

                    {step !== 'done' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                            {stepKeys.map((s, i) => {
                                const cur = stepKeys.indexOf(step);
                                const done = i < cur, active = i === cur;
                                return (
                                    <React.Fragment key={s}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', background: done ? '#2ecc71' : active ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#e0e0e0', color: (done || active) ? 'white' : '#999', transition: 'all 0.3s' }}>
                                            {done ? '✓' : i + 1}
                                        </div>
                                        {i < 2 && <div style={{ width: 40, height: 2, background: done ? '#2ecc71' : '#e0e0e0', borderRadius: 2, transition: 'all 0.3s' }} />}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {step === 'email' && (
                        <>
                            <div className="auth-header">
                                <h2>Forgot Password?</h2>
                                <p>Enter your university email and we will send you a reset code</p>
                            </div>
                            <form onSubmit={handleSendCode}>
                                <div className="form-group">
                                    <label className="form-label">University Email</label>
                                    <input type="email" className="form-input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoFocus />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sending Code...' : 'Send Reset Code →'}</button>
                            </form>
                            <div className="auth-switch" style={{ marginTop: '1.5rem' }}>
                                Remember your password? <a className="auth-link" onClick={onBack}>Back to Sign In</a>
                            </div>
                        </>
                    )}

                    {step === 'code' && (
                        <>
                            <div className="auth-header">
                                <h2>Enter Code</h2>
                                <p>We sent a 6-digit code to <strong>{email}</strong></p>
                            </div>
                            <form onSubmit={handleVerifyCode}>
                                <div className="form-group">
                                    <label className="form-label">Verification Code</label>
                                    <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', margin: '0.5rem 0 1.5rem' }}>
                                        {code.map((digit, i) => (
                                            <input key={i} id={`rc-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                                                onChange={(e) => handleCodeChange(e.target.value, i)}
                                                onKeyDown={(e) => handleCodeKeyDown(e, i)}
                                                disabled={loading}
                                                style={{ width: 48, height: 58, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, border: '2px solid ' + (digit ? '#667eea' : '#e0e0e0'), borderRadius: 12, outline: 'none', fontFamily: 'DM Sans, sans-serif', background: digit ? 'rgba(102,126,234,0.05)' : 'white', transition: 'border-color 0.2s' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify Code →'}</button>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: '1.25rem', color: '#666', fontSize: '0.95rem' }}>
                                Didn't receive it?{' '}
                                {resendTimer > 0 ? <span style={{ color: '#999' }}>Resend in {resendTimer}s</span> : <a className="auth-link" onClick={handleResend}>Resend Code</a>}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                                <a className="auth-link" onClick={() => { setStep('email'); setError(''); }}>← Use a different email</a>
                            </div>
                        </>
                    )}

                    {step === 'newpass' && (
                        <>
                            <div className="auth-header">
                                <h2>New Password</h2>
                                <p>Choose a strong password for your account</p>
                            </div>
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showNew ? 'text' : 'password'} className="form-input" placeholder="Minimum 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={loading} style={{ paddingRight: '3rem' }} />
                                        <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999' }}>{showNew ? '🙈' : '👁️'}</button>
                                    </div>
                                    {newPassword.length > 0 && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: '0.25rem' }}>
                                                {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColor[strength] : '#e0e0e0', transition: 'background 0.3s' }} />)}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: strengthColor[strength], fontWeight: 600 }}>{strengthLabel[strength]}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showConfirm ? 'text' : 'password'} className="form-input" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} style={{ paddingRight: '3rem', borderColor: confirmPassword ? (confirmPassword === newPassword ? '#2ecc71' : '#e94560') : undefined }} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999' }}>{showConfirm ? '🙈' : '👁️'}</button>
                                    </div>
                                    {confirmPassword && confirmPassword !== newPassword && <div style={{ fontSize: '0.85rem', color: '#e94560', marginTop: '0.4rem' }}>Passwords do not match</div>}
                                    {confirmPassword && confirmPassword === newPassword && <div style={{ fontSize: '0.85rem', color: '#2ecc71', marginTop: '0.4rem' }}>✓ Passwords match</div>}
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Reset Password'}</button>
                            </form>
                        </>
                    )}

                    {step === 'done' && (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '0.75rem', background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Password Reset!</h2>
                            <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>Your password has been successfully updated.<br />You can now sign in with your new password.</p>
                            <button className="btn-primary" onClick={onBack} style={{ maxWidth: 280, margin: '0 auto' }}>Back to Sign In →</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}




function RegisterOtpPage({ email, onVerified, onBack, onResend }) {
    const [code, setCode]             = useState(['', '', '', '', '', '']);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [loading, setLoading]       = useState(false);
    const [resendTimer, setResendTimer] = useState(60);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setInterval(() => setResendTimer(n => n - 1), 1000);
        return () => clearInterval(t);
    }, [resendTimer]);

    const handleCodeChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const updated = [...code]; updated[idx] = val; setCode(updated);
        if (val && idx < 5) document.getElementById(`reg-otp-${idx + 1}`)?.focus();
    };

    const handleCodeKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0)
            document.getElementById(`reg-otp-${idx - 1}`)?.focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        const fullCode = code.join('');
        if (fullCode.length < 6) { setError('Please enter the full 6-digit code'); return; }
        setLoading(true);
        const success = await onVerified(fullCode);
        if (!success) {
            setError('Invalid or expired OTP. Please try again.');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setCode(['', '', '', '', '', '']);
        setError('');
        try {
            const res = await onResend();
            if (res && res.success) {
                setSuccess('A new code has been sent!');
            } else {
                setError('Failed to resend code. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
        setResendTimer(60);
    };

    return (
        <div className="main-content">
            <div className="hero">
                <div className="hero-content">
                    <h1>Welcome to LINKEVENT</h1>
                    <p>Your centralized platform for planning, managing, and participating in all university events.</p>
                    <div className="hero-features">
                        <div className="hero-feature"><div className="hero-feature-icon">📅</div><span>Easy Event Creation</span></div>
                        <div className="hero-feature"><div className="hero-feature-icon">🔒</div><span>Secure Registration</span></div>
                        <div className="hero-feature"><div className="hero-feature-icon">📧</div><span>Smart Notifications</span></div>
                    </div>
                </div>
            </div>

            <div className="auth-container">
                <div className="auth-visual" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                    <div className="auth-visual-content">
                        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📧</div>
                        <h3>Verify Your Email</h3>
                        <p>Almost there! Enter the 6-digit code we sent to your university email to activate your account.</p>
                        <div className="auth-visual-features" style={{ marginTop: '2rem' }}>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">🔢</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>6-Digit Code</div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Check your university inbox</div>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">⏱️</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Code Expires in 10 min</div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Request a new one if needed</div>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">✅</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>One-Time Verification</div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Only needed once at signup</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>Verify Email</h2>
                        <p>We sent a 6-digit code to <strong>{email}</strong></p>
                    </div>

                    {error   && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleVerify}>
                        <div className="form-group">
                            <label className="form-label">Verification Code</label>
                            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', margin: '0.5rem 0 1.75rem' }}>
                                {code.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`reg-otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(e.target.value, i)}
                                        onKeyDown={(e) => handleCodeKeyDown(e, i)}
                                        disabled={loading}
                                        autoFocus={i === 0}
                                        style={{
                                            width: 48, height: 58, textAlign: 'center',
                                            fontSize: '1.5rem', fontWeight: 700,
                                            border: '2px solid ' + (digit ? '#667eea' : '#e0e0e0'),
                                            borderRadius: 12, outline: 'none',
                                            fontFamily: 'DM Sans, sans-serif',
                                            background: digit ? 'rgba(102,126,234,0.05)' : 'white',
                                            transition: 'border-color 0.2s'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.25rem', color: '#666', fontSize: '0.95rem' }}>
                        Didn't receive it?{' '}
                        {resendTimer > 0
                            ? <span style={{ color: '#999' }}>Resend in {resendTimer}s</span>
                            : <a className="auth-link" onClick={handleResend}>Resend Code</a>
                        }
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                        <a className="auth-link" onClick={onBack}>← Back to Sign In</a>
                    </div>
                </div>
            </div>
        </div>
    );
}


function EventsPage({ events, filter, setFilter, currentUser, registeredEvents, onRegister, onUnregister, onEventClick, onCreateClick }) {
    return (
        <>
            <div className="events-header">
                <h2>Upcoming Events</h2>
                {currentUser.role === 'admin' && <button className="btn-create" onClick={onCreateClick}>+ Create Event</button>}
            </div>
            <div className="events-filters">
                <button className={`filter-btn ${filter === 'all'     ? 'active' : ''}`} onClick={() => setFilter('all')}>All Events</button>
                <button className={`filter-btn ${filter === 'public'  ? 'active' : ''}`} onClick={() => setFilter('public')}>Public Events</button>
                <button className={`filter-btn ${filter === 'private' ? 'active' : ''}`} onClick={() => setFilter('private')}>Private Events</button>
            </div>
            {events.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No events found</h3><p>Check back later for upcoming events</p></div>
            ) : (
                <div className="events-grid">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} isRegistered={registeredEvents.includes(event.id)} onRegister={onRegister} onUnregister={onUnregister} onClick={onEventClick} />
                    ))}
                </div>
            )}
        </>
    );
}


function EventCard({ event, isRegistered, onRegister, onUnregister, onClick }) {
    return (
        <div className="event-card" onClick={() => onClick(event)}>
            <div className="event-header">
                <span className="event-type">{event.type === 'public' ? '🌍 Public' : '🔒 Private'}</span>
                <h3 className="event-title">{event.title}</h3>
            </div>
            <div className="event-body">
                <div className="event-info">
                    <div className="info-item"><span className="info-icon">📅</span><span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div className="info-item"><span className="info-icon">🕐</span><span>{event.time}</span></div>
                    <div className="info-item"><span className="info-icon">📍</span><span>{event.location}</span></div>
                </div>
                <p className="event-description">{event.description}</p>
                <div className="event-footer">
                    <div className="participants"><span>👥</span><span>{event.participants}/{event.maxParticipants} registered</span></div>
                    <button className={`btn-register ${isRegistered ? 'btn-registered' : ''}`} onClick={(e) => { e.stopPropagation(); isRegistered ? onUnregister(event.id) : onRegister(event.id); }}>
                        {isRegistered ? '✓ Registered' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}


function EventModal({ event, isRegistered, onClose, onRegister, onUnregister }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{event.title}</h3>
                    <span className="event-type" style={{ background: 'rgba(255,255,255,0.2)' }}>{event.type === 'public' ? '🌍 Public Event' : '🔒 Private Event'}</span>
                </div>
                <div className="modal-body">
                    <div className="event-info" style={{ marginBottom: '1.5rem' }}>
                        <div className="info-item"><span className="info-icon">📅</span><span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                        <div className="info-item"><span className="info-icon">🕐</span><span>{event.time}</span></div>
                        <div className="info-item"><span className="info-icon">📍</span><span>{event.location}</span></div>
                        <div className="info-item"><span className="info-icon">👥</span><span>{event.participants}/{event.maxParticipants} participants registered</span></div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>About This Event</h4>
                        <p style={{ color: '#666', lineHeight: 1.6 }}>{event.description}</p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Agenda</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {event.agenda.map((item, idx) => (
                                <li key={idx} style={{ padding: '0.75rem', background: '#f8f8f8', marginBottom: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ width: 24, height: 24, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{idx + 1}</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                    {!isRegistered ? (
                        <button className="btn-primary" onClick={onRegister} style={{ width: 'auto', padding: '0.75rem 2rem' }}>Register for Event</button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '10px', fontWeight: 600 }}>✓ You're registered!</div>
                            <button onClick={onUnregister} style={{ padding: '0.75rem 1.5rem', background: 'rgba(233,69,96,0.08)', color: '#e94560', border: '2px solid rgba(233,69,96,0.3)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }} onMouseOver={e => { e.target.style.background='#e94560'; e.target.style.color='white'; }} onMouseOut={e => { e.target.style.background='rgba(233,69,96,0.08)'; e.target.style.color='#e94560'; }}>Cancel Registration</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function CalendarPage({ events }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear(), month = date.getMonth();
        const startingDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevLast    = new Date(year, month, 0).getDate();
        const days = [];
        for (let i = startingDay - 1; i >= 0; i--)  days.push({ day: prevLast - i, isCurrentMonth: false, date: new Date(year, month - 1, prevLast - i) });
        for (let i = 1; i <= daysInMonth; i++)       days.push({ day: i, isCurrentMonth: true,  date: new Date(year, month, i) });
        for (let i = 1; i <= 42 - days.length; i++)  days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
        return days;
    };

    const hasEvent = (date) => events.some(e => e.date === date.toISOString().split('T')[0]);
    const days = getDaysInMonth(currentDate);

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2 className="calendar-month">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>←</button>
                    <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
                    <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>→</button>
                </div>
            </div>
            <div className="calendar-grid">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                {days.map((day, idx) => (
                    <div key={idx} className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${hasEvent(day.date) ? 'has-event' : ''}`}>
                        {day.day}
                        {hasEvent(day.date) && <div className="event-dot"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
}


function CreateEventModal({ onClose, onCreate }) {
    const [formData, setFormData]             = useState({ title: '', description: '', date: '', time: '', location: '', type: 'public', maxParticipants: 100 });
    const [agenda, setAgenda]                 = useState([]);
    const [newAgendaItem, setNewAgendaItem]   = useState('');

    const handleChange      = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleAddAgenda   = () => { if (newAgendaItem.trim()) { setAgenda([...agenda, newAgendaItem.trim()]); setNewAgendaItem(''); } };
    const handleRemoveAgenda = (i) => setAgenda(agenda.filter((_, idx) => idx !== i));
    const handleSubmit      = (e) => { e.preventDefault(); onCreate({ ...formData, agenda: agenda.length > 0 ? agenda : ['Event Program'] }); };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create New Event</h3>
                    <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Fill in the details to create a new university event</p>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="create-event-grid">
                            <div className="form-group form-group-full"><label className="form-label">Event Title *</label><input type="text" name="title" className="form-input" placeholder="Enter event title" value={formData.title} onChange={handleChange} required /></div>
                            <div className="form-group form-group-full"><label className="form-label">Description *</label><textarea name="description" className="form-textarea" placeholder="Describe your event..." value={formData.description} onChange={handleChange} required /></div>
                            <div className="form-group"><label className="form-label">Event Date *</label><input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required /></div>
                            <div className="form-group"><label className="form-label">Event Time *</label><input type="time" name="time" className="form-input" value={formData.time} onChange={handleChange} required /></div>
                            <div className="form-group form-group-full"><label className="form-label">Location *</label><input type="text" name="location" className="form-input" placeholder="Building, Room Number" value={formData.location} onChange={handleChange} required /></div>
                            <div className="form-group">
                                <label className="form-label">Event Type *</label>
                                <div className="event-type-toggle">
                                    <button type="button" className={`event-type-option ${formData.type === 'public'  ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, type: 'public' }))}>🌍 Public</button>
                                    <button type="button" className={`event-type-option ${formData.type === 'private' ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, type: 'private' }))}>🔒 Private</button>
                                </div>
                            </div>
                            <div className="form-group"><label className="form-label">Max Participants *</label><input type="number" name="maxParticipants" className="form-input" placeholder="100" min="1" value={formData.maxParticipants} onChange={handleChange} required /></div>
                            <div className="form-group form-group-full">
                                <label className="form-label">Event Agenda</label>
                                <div className="agenda-builder">
                                    {agenda.length > 0 && (
                                        <div className="agenda-items">
                                            {agenda.map((item, index) => (
                                                <div key={index} className="agenda-item">
                                                    <div className="agenda-item-number">{index + 1}</div>
                                                    <div className="agenda-item-text">{item}</div>
                                                    <button type="button" className="agenda-item-remove" onClick={() => handleRemoveAgenda(index)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="agenda-input-group">
                                        <input type="text" className="agenda-input" placeholder="Add agenda item (e.g., 'Welcome Speech')" value={newAgendaItem} onChange={(e) => setNewAgendaItem(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAgenda(); } }} />
                                        <button type="button" className="btn-add-agenda" onClick={handleAddAgenda}>+ Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit} style={{ width: 'auto', padding: '0.75rem 2rem' }}>Create Event</button>
                </div>
            </div>
        </div>
    );
}


function AdminPage({ events, users }) {
    const totalEvents       = events.length;
    const publicEvents      = events.filter(e => e.type === 'public').length;
    const privateEvents     = events.filter(e => e.type === 'private').length;
    const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0);

    return (
        <>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Admin Dashboard</h2>
            </div>
            <div className="admin-dashboard">
                <div className="stat-card"><div className="stat-icon" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>📅</div><div className="stat-value">{totalEvents}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-icon" style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)' }}>🌍</div><div className="stat-value">{publicEvents}</div><div className="stat-label">Public Events</div></div>
                <div className="stat-card"><div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>🔒</div><div className="stat-value">{privateEvents}</div><div className="stat-label">Private Events</div></div>
                <div className="stat-card"><div className="stat-icon" style={{ background: 'linear-gradient(135deg,#fa709a,#fee140)' }}>👥</div><div className="stat-value">{totalParticipants}</div><div className="stat-label">Total Participants</div></div>
            </div>
            <div className="admin-table">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', marginBottom: '1.5rem' }}>Registered Users</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`badge badge-${user.role}`}>{user.role.toUpperCase()}</span></td>
                                    <td style={{ color: '#2ecc71', fontWeight: 600 }}>● Active</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="admin-table" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', marginBottom: '1.5rem' }}>Event Overview</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead><tr><th>Event Name</th><th>Type</th><th>Date</th><th>Participants</th><th>Capacity</th></tr></thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td style={{ fontWeight: 600 }}>{event.title}</td>
                                    <td><span className={`badge badge-${event.type}`}>{event.type.toUpperCase()}</span></td>
                                    <td>{new Date(event.date).toLocaleDateString()}</td>
                                    <td>{event.participants}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${(event.participants / event.maxParticipants) * 100}%`, height: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)', transition: 'width 0.3s' }} />
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{event.maxParticipants}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}


ReactDOM.render(<App />, document.getElementById('root'));
