const { useState, useEffect } = React;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS = [
    { email: 'student@university.edu', password: 'student123', role: 'student', name: 'Alex Johnson' },
    { email: 'staff@university.edu',   password: 'staff123',   role: 'staff',   name: 'Dr. Sarah Mitchell' },
    { email: 'admin@university.edu',   password: 'admin123',   role: 'admin',   name: 'Admin User' }
];

const MOCK_EVENTS = [
    { id: 1,  title: 'Annual Tech Summit 2025',         description: 'Join us for an exciting day of innovation, technology discussions, and networking opportunities with industry leaders.',                       date: '2025-03-15', time: '09:00 AM', location: 'Main Auditorium, Building A',    type: 'public',  participants: 145, maxParticipants: 200, agenda: ['Opening Keynote - Future of AI', 'Workshop: Machine Learning Basics', 'Panel Discussion: Tech Careers', 'Networking Lunch', 'Closing Remarks'] },
    { id: 2,  title: 'Faculty Research Symposium',      description: 'Exclusive presentation of cutting-edge research findings by our distinguished faculty members across various disciplines.',                  date: '2025-03-20', time: '02:00 PM', location: 'Research Center, Room 301',      type: 'private', participants: 32,  maxParticipants: 50,  agenda: ['Welcome Address', 'Research Presentations - Session 1', 'Coffee Break', 'Research Presentations - Session 2', 'Q&A and Discussion'] },
    { id: 3,  title: 'Student Innovation Showcase',     description: 'Students present their innovative projects and prototypes to the university community. Featuring awards and prizes!',                       date: '2025-03-25', time: '10:00 AM', location: 'Innovation Lab, Building C',     type: 'public',  participants: 89,  maxParticipants: 150, agenda: ['Registration & Setup', 'Project Demonstrations Round 1', 'Lunch Break', 'Project Demonstrations Round 2', 'Judging & Awards Ceremony'] },
    { id: 4,  title: 'Career Development Workshop',     description: 'Essential skills workshop covering resume building, interview techniques, networking strategies, and career planning.',                      date: '2025-04-05', time: '03:00 PM', location: 'Career Center, Hall B',          type: 'public',  participants: 67,  maxParticipants: 100, agenda: ['Resume & CV Workshop', 'LinkedIn Profile Optimization', 'Mock Interview Sessions', 'Networking Tips & Strategies', 'Career Path Planning'] },
    { id: 5,  title: 'Department Strategy Meeting',     description: 'Strategic planning session for department heads and senior staff members to discuss future initiatives.',                                   date: '2025-04-10', time: '11:00 AM', location: 'Executive Board Room',           type: 'private', participants: 15,  maxParticipants: 25,  agenda: ['Budget Review Q1', 'Strategic Goals for 2025-2026', 'Resource Allocation', 'Action Planning', 'Next Steps'] },
    { id: 6,  title: 'Web Development Bootcamp',        description: 'Intensive 3-day bootcamp covering HTML, CSS, JavaScript, React, and modern web development practices.',                                    date: '2025-04-15', time: '09:00 AM', location: 'Computer Lab 5, Building D',    type: 'public',  participants: 78,  maxParticipants: 80,  agenda: ['HTML & CSS Fundamentals', 'JavaScript Essentials', 'React Introduction', 'Building Your First App', 'Deployment & Best Practices'] },
    { id: 7,  title: 'Mental Health Awareness Week',    description: 'Campus-wide initiative promoting mental health awareness with workshops, counseling sessions, and wellness activities.',                    date: '2025-04-18', time: '10:00 AM', location: 'Student Wellness Center',        type: 'public',  participants: 134, maxParticipants: 200, agenda: ['Opening Session', 'Stress Management Workshop', 'Group Meditation', 'Mental Health Resources Fair', 'Community Circle'] },
    { id: 8,  title: 'Alumni Networking Night',         description: 'Connect with successful alumni from various industries. Great opportunity for mentorship and career guidance.',                             date: '2025-04-22', time: '06:00 PM', location: 'University Club, Main Campus',   type: 'public',  participants: 95,  maxParticipants: 150, agenda: ['Welcome Reception', 'Alumni Spotlight Talks', 'Speed Networking Sessions', 'Industry Breakout Groups', 'Closing Mixer'] },
    { id: 9,  title: 'Grant Writing Workshop',          description: 'Staff development session focused on effective grant proposal writing and securing research funding.',                                     date: '2025-04-28', time: '01:00 PM', location: 'Faculty Development Center',    type: 'private', participants: 22,  maxParticipants: 30,  agenda: ['Grant Landscape Overview', 'Proposal Structure & Components', 'Budget Development', 'Review & Feedback Session', 'Submission Best Practices'] },
    { id: 10, title: 'Spring Music Festival',           description: 'Celebrate spring with live performances from student bands, orchestras, and solo artists. Food trucks and activities!',                   date: '2025-05-01', time: '12:00 PM', location: 'University Green',               type: 'public',  participants: 287, maxParticipants: 500, agenda: ['Opening Performance', 'Student Band Showcase', 'Food & Activities Break', 'Orchestra Performance', 'Headliner & Closing'] },
    { id: 11, title: 'Cybersecurity Seminar',           description: 'Learn about the latest cybersecurity threats, protection strategies, and best practices for digital safety.',                             date: '2025-05-05', time: '02:00 PM', location: 'Tech Center Auditorium',         type: 'public',  participants: 56,  maxParticipants: 120, agenda: ['Current Threat Landscape', 'Password Security & 2FA', 'Phishing Prevention', 'Data Protection Strategies', 'Q&A with Security Experts'] },
    { id: 12, title: 'Diversity & Inclusion Forum',     description: 'Open forum discussing diversity, equity, and inclusion initiatives on campus. All community members welcome.',                            date: '2025-05-10', time: '04:00 PM', location: 'Student Union, Room 201',        type: 'public',  participants: 103, maxParticipants: 150, agenda: ['Welcome & Overview', 'Panel Discussion', 'Breakout Sessions', 'Community Feedback', 'Action Items & Next Steps'] },
    { id: 13, title: 'Academic Senate Meeting',         description: 'Monthly academic senate meeting for faculty representatives to discuss curriculum and policy matters.',                                   date: '2025-05-12', time: '03:00 PM', location: 'Senate Chambers, Admin Building', type: 'private', participants: 28,  maxParticipants: 40,  agenda: ['Previous Minutes Approval', 'Curriculum Committee Report', 'New Course Proposals', 'Policy Updates', 'Open Discussion'] },
    { id: 14, title: 'Entrepreneurship Pitch Competition', description: 'Student startups pitch their business ideas to judges and investors. $10,000 in prizes available!',                                  date: '2025-05-18', time: '10:00 AM', location: 'Business School Auditorium',    type: 'public',  participants: 125, maxParticipants: 200, agenda: ['Competition Rules & Format', 'Pitch Round 1 (10 teams)', 'Break & Networking', 'Pitch Round 2 (Finalists)', 'Winner Announcement'] },
    { id: 15, title: 'Summer Research Kickoff',         description: 'Launch event for summer research programs featuring presentations from research leads and team assignments.',                              date: '2025-05-25', time: '09:00 AM', location: 'Research Building, Main Hall',   type: 'public',  participants: 71,  maxParticipants: 100, agenda: ['Program Overview', 'Research Project Presentations', 'Lab Tours', 'Team Assignments', 'Safety Training & Resources'] }
];


// ─── App Component ────────────────────────────────────────────────────────────

function App() {
    const [currentUser, setCurrentUser]           = useState(null);
    const [currentPage, setCurrentPage]           = useState('home');
    const [events, setEvents]                     = useState(MOCK_EVENTS);
    const [filter, setFilter]                     = useState('all');
    const [selectedEvent, setSelectedEvent]       = useState(null);
    const [showModal, setShowModal]               = useState(false);
    const [showCreateModal, setShowCreateModal]   = useState(false);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [authPage, setAuthPage]                 = useState('login'); // 'login' | 'forgot'

    const handleLogin = (email, password) => {
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (user) { setCurrentUser(user); setCurrentPage('events'); return true; }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('home');
        setAuthPage('login');
        setRegisteredEvents([]);
    };

    const handleRegister = (eventId) => {
        if (!registeredEvents.includes(eventId)) {
            setRegisteredEvents([...registeredEvents, eventId]);
            setEvents(events.map(e => e.id === eventId ? { ...e, participants: e.participants + 1 } : e));
        }
    };

    const handleUnregister = (eventId) => {
        setRegisteredEvents(registeredEvents.filter(id => id !== eventId));
        setEvents(events.map(e => e.id === eventId ? { ...e, participants: Math.max(0, e.participants - 1) } : e));
    };

    const handleCreateEvent = (newEvent) => {
        setEvents([{ ...newEvent, id: events.length + 1, participants: 0 }, ...events]);
        setShowCreateModal(false);
    };

    const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

    return (
        <div className="app-container">
            {currentUser && (
                <Navbar currentUser={currentUser} currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
            )}
            {!currentUser ? (
                authPage === 'login'
                    ? <LoginPage onLogin={handleLogin} onForgotPassword={() => setAuthPage('forgot')} />
                    : <ForgotPasswordPage onBack={() => setAuthPage('login')} />
            ) : (
                <div className="main-content">
                    {currentPage === 'events' && (
                        <EventsPage
                            events={filteredEvents} filter={filter} setFilter={setFilter}
                            currentUser={currentUser} registeredEvents={registeredEvents}
                            onRegister={handleRegister} onUnregister={handleUnregister}
                            onEventClick={(event) => { setSelectedEvent(event); setShowModal(true); }}
                            onCreateClick={() => setShowCreateModal(true)}
                        />
                    )}
                    {currentPage === 'calendar' && <CalendarPage events={events} />}
                    {currentPage === 'admin' && currentUser.role === 'admin' && <AdminPage events={events} users={MOCK_USERS} />}
                    {showModal && selectedEvent && (
                        <EventModal
                            event={selectedEvent}
                            isRegistered={registeredEvents.includes(selectedEvent.id)}
                            onClose={() => setShowModal(false)}
                            onRegister={() => { handleRegister(selectedEvent.id); setShowModal(false); }}
                            onUnregister={() => { handleUnregister(selectedEvent.id); setShowModal(false); }}
                        />
                    )}
                    {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateEvent} />}
                </div>
            )}
        </div>
    );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

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

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onForgotPassword }) {
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [error, setError]           = useState('');
    const [loading, setLoading]       = useState(false);
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!email.includes('@university.edu')) { setError('Please use a valid university email address'); return; }
        setLoading(true);
        setTimeout(() => {
            const success = onLogin(email, password);
            if (!success) setError('Invalid email or password');
            setLoading(false);
        }, 600);
    };

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

                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
                        <p>Use your university email to continue</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">University Email</label>
                            <input type="email" className="form-input" placeholder="your.email@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
                            <a className="auth-link" onClick={onForgotPassword} style={{ fontSize: '0.9rem' }}>Forgot password?</a>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Signing in...' : (isRegister ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    <div className="auth-switch">
                        {isRegister ? "Already have an account? " : "Don't have an account? "}
                        <a className="auth-link" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Sign In' : 'Register'}</a>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'linear-gradient(135deg,rgba(102,126,234,0.05),rgba(118,75,162,0.05))', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid rgba(102,126,234,0.1)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#667eea' }}>🔐 Demo Accounts:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#666' }}>
                            <div><strong>Student:</strong> student@university.edu / student123</div>
                            <div><strong>Staff:</strong> staff@university.edu / staff123</div>
                            <div><strong>Admin:</strong> admin@university.edu / admin123</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Forgot Password Page ─────────────────────────────────────────────────────
// Step 1: email  →  Step 2: verify code  →  Step 3: new password  →  done

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

    const handleSendCode = (e) => {
        e.preventDefault(); setError('');
        if (!email.includes('@university.edu')) { setError('Please use a valid university email address'); return; }
        setLoading(true);
        // TODO: replace with → fetch('/auth/forgot-password', { method:'POST', body: JSON.stringify({ email }) })
        setTimeout(() => { setLoading(false); setStep('code'); setResendTimer(60); }, 800);
    };

    const handleVerifyCode = (e) => {
        e.preventDefault(); setError('');
        if (code.join('').length < 6) { setError('Please enter the full 6-digit code'); return; }
        setLoading(true);
        // TODO: replace with → fetch('/auth/verify-reset-code', { method:'POST', body: JSON.stringify({ email, code: code.join('') }) })
        setTimeout(() => { setLoading(false); setStep('newpass'); }, 800);
    };

    const handleResetPassword = (e) => {
        e.preventDefault(); setError('');
        if (newPassword.length < 8)          { setError('Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword)  { setError('Passwords do not match'); return; }
        setLoading(true);
        // TODO: replace with → fetch('/auth/reset-password', { method:'POST', body: JSON.stringify({ email, password: newPassword }) })
        setTimeout(() => { setLoading(false); setStep('done'); }, 800);
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
        // TODO: replace with → fetch('/auth/forgot-password', ...)
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
                                    <input type="email" className="form-input" placeholder="your.email@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoFocus />
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

// ─── Events Page ──────────────────────────────────────────────────────────────

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

// ─── Event Card ───────────────────────────────────────────────────────────────

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

// ─── Event Modal ──────────────────────────────────────────────────────────────

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

// ─── Calendar Page ────────────────────────────────────────────────────────────

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

// ─── Create Event Modal ───────────────────────────────────────────────────────

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

// ─── Admin Page ───────────────────────────────────────────────────────────────

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

// ─── Render ───────────────────────────────────────────────────────────────────

ReactDOM.render(<App />, document.getElementById('root'));
