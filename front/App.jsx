const { useState, useEffect } = React;

// --- API Helper Layer ---
// Change this to match your backend server address
const API_BASE = 'http://127.0.0.1:8000';

function getTokens() {
    try {
        return JSON.parse(localStorage.getItem('tokens'));
    } catch {
        return null;
    }
}

function saveTokens(tokens) {
    localStorage.setItem('tokens', JSON.stringify(tokens));
}

function clearTokens() {
    localStorage.removeItem('tokens');
}

async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const tokens = getTokens();
    if (tokens && tokens.access) {
        headers['Authorization'] = `Bearer ${tokens.access}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error('API Error');
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : 'N/A';
}

function formatApiError(d) {
    if (typeof d === 'string') return d;
    if (d.detail) return d.detail;
    if (d.message) return d.message;
    try {
        return Object.values(d).flat().filter(v => typeof v === 'string').join(', ') || 'An error occurred';
    } catch {
        return 'An error occurred';
    }
}

function formatAgendaItem(item) {
    if (item.time_slot) {
        return `${item.time_slot} — ${item.action || ''}`;
    }
    return item.action || String(item);
}

// --- App Component ---
function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('home');
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authStep, setAuthStep] = useState('login');
    const [pendingEmail, setPendingEmail] = useState('');

    useEffect(() => {
        const tokens = getTokens();
        if (tokens && tokens.access) {
            setCurrentUser({ name: 'User' });
            setCurrentPage('events');
        }
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/events/');
            setEvents(Array.isArray(data) ? data : []);
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) fetchEvents();
    }, [currentUser]);

    const handleLogin = async (username, password) => {
        const data = await apiFetch('/api/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        saveTokens(data.tokens);
        setCurrentUser({ name: username });
        setCurrentPage('events');
        setAuthStep('login');
    };

    const handleRegister = async (username, email, phone, password) => {
        const data = await apiFetch('/api/register/', {
            method: 'POST',
            body: JSON.stringify({ username, email, phone, password }),
        });
        setPendingEmail(email);
        setAuthStep('verify-otp');
        return data;
    };

    const handleVerifyOTP = async (email, otp) => {
        const data = await apiFetch('/api/verify-otp/', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
        saveTokens(data.tokens);
        setCurrentUser({ name: email });
        setCurrentPage('events');
        setAuthStep('login');
    };

    const handleLogout = async () => {
        try {
            const tokens = getTokens();
            if (tokens && tokens.refresh) {
                await apiFetch('/api/logout/', {
                    method: 'POST',
                    body: JSON.stringify({ refresh: tokens.refresh }),
                });
            }
        } catch {
            // logout even if API fails
        }
        clearTokens();
        setCurrentUser(null);
        setCurrentPage('home');
        setEvents([]);
    };

    const handleCreateEvent = async (eventData) => {
        const created = await apiFetch('/api/events/', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
        setEvents([created, ...events]);
        setShowCreateModal(false);
    };

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.visibility === filter);

    return (
        <div className="app-container">
            {currentUser && <Navbar
                currentUser={currentUser}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={handleLogout}
            />}

            {!currentUser ? (
                <AuthPage
                    authStep={authStep}
                    setAuthStep={setAuthStep}
                    pendingEmail={pendingEmail}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onVerifyOTP={handleVerifyOTP}
                />
            ) : (
                <div className="main-content">
                    {currentPage === 'events' && (
                        <EventsPage
                            events={filteredEvents}
                            filter={filter}
                            setFilter={setFilter}
                            loading={loading}
                            onEventClick={(event) => {
                                setSelectedEvent(event);
                                setShowModal(true);
                            }}
                            onCreateClick={() => setShowCreateModal(true)}
                        />
                    )}

                    {currentPage === 'calendar' && (
                        <CalendarPage events={events} />
                    )}

                    {showModal && selectedEvent && (
                        <EventModal
                            event={selectedEvent}
                            onClose={() => setShowModal(false)}
                        />
                    )}

                    {showCreateModal && (
                        <CreateEventModal
                            onClose={() => setShowCreateModal(false)}
                            onCreate={handleCreateEvent}
                        />
                    )}
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
                    <button
                        className={`nav-btn ${currentPage === 'events' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('events')}
                    >
                        Events
                    </button>
                    <button
                        className={`nav-btn ${currentPage === 'calendar' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('calendar')}
                    >
                        Calendar
                    </button>
                    <button className="nav-btn btn-logout" onClick={onLogout}>
                        Logout ({currentUser.name})
                    </button>
                </div>
            </div>
        </nav>
    );
}

function AuthPage({ authStep, setAuthStep, pendingEmail, onLogin, onRegister, onVerifyOTP }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await onLogin(username, password);
        } catch (err) {
            setError(err.data?.detail || err.data?.message || 'Invalid username or password');
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const data = await onRegister(username, email, phone, password);
            setSuccess(data.message || 'Registration successful! Check your email for OTP.');
        } catch (err) {
            setError(formatApiError(err.data || {}));
        }
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await onVerifyOTP(pendingEmail, otp);
        } catch (err) {
            setError(err.data?.detail || err.data?.message || 'Invalid OTP');
        }
    };

    const resetFields = () => {
        setUsername(''); setEmail(''); setPhone(''); setPassword(''); setOtp('');
        setError(''); setSuccess('');
    };

    return (
        <div className="main-content">
            <div className="hero">
                <div className="hero-content">
                    <h1>Welcome to LINKEVENT</h1>
                    <p>Your centralized platform for planning, managing, and participating in all university events. Streamline event organization with secure registration and real-time updates.</p>
                    <div className="hero-features">
                        <div className="hero-feature">
                            <div className="hero-feature-icon">📅</div>
                            <span>Easy Event Creation</span>
                        </div>
                        <div className="hero-feature">
                            <div className="hero-feature-icon">🔒</div>
                            <span>Secure Registration</span>
                        </div>
                        <div className="hero-feature">
                            <div className="hero-feature-icon">📧</div>
                            <span>Smart Notifications</span>
                        </div>
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
                    {authStep === 'login' && (
                        <>
                            <div className="auth-header">
                                <h2>Sign In</h2>
                                <p>Enter your credentials to continue</p>
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <form onSubmit={handleLoginSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input type="text" className="form-input" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-primary">Sign In</button>
                            </form>
                            <div className="auth-switch">
                                Don't have an account?{' '}
                                <a className="auth-link" onClick={() => { resetFields(); setAuthStep('register'); }}>Register</a>
                            </div>
                        </>
                    )}

                    {authStep === 'register' && (
                        <>
                            <div className="auth-header">
                                <h2>Create Account</h2>
                                <p>Fill in your details to register</p>
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            {success && <div className="error-message" style={{ background: 'rgba(46,204,113,0.08)', color: '#2ecc71', borderColor: 'rgba(46,204,113,0.2)' }}>{success}</div>}
                            <form onSubmit={handleRegisterSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input type="text" className="form-input" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input type="tel" className="form-input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-input" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-primary">Create Account</button>
                            </form>
                            <div className="auth-switch">
                                Already have an account?{' '}
                                <a className="auth-link" onClick={() => { resetFields(); setAuthStep('login'); }}>Sign In</a>
                            </div>
                        </>
                    )}

                    {authStep === 'verify-otp' && (
                        <>
                            <div className="auth-header">
                                <h2>Verify OTP</h2>
                                <p>Enter the verification code sent to your email</p>
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <form onSubmit={handleOTPSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={pendingEmail} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">OTP Code</label>
                                    <input type="text" className="form-input" placeholder="Enter OTP code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-primary">Verify</button>
                            </form>
                            <div className="auth-switch">
                                <a className="auth-link" onClick={() => { resetFields(); setAuthStep('login'); }}>Back to Sign In</a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function EventsPage({ events, filter, setFilter, loading, onEventClick, onCreateClick }) {
    return (
        <>
            <div className="events-header">
                <h2>Upcoming Events</h2>
                <button className="btn-create" onClick={onCreateClick}>+ Create Event</button>
            </div>

            <div className="events-filters">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Events</button>
                <button className={`filter-btn ${filter === 'public' ? 'active' : ''}`} onClick={() => setFilter('public')}>Public Events</button>
                <button className={`filter-btn ${filter === 'private' ? 'active' : ''}`} onClick={() => setFilter('private')}>Private Events</button>
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⏳</div>
                    <h3>Loading events...</h3>
                </div>
            ) : events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3>No events found</h3>
                    <p>Check back later for upcoming events</p>
                </div>
            ) : (
                <div className="events-grid">
                    {events.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onClick={onEventClick}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

function EventCard({ event, onClick }) {
    const location = [event.building, event.room].filter(Boolean).join(', ') || 'TBD';
    const startDate = event.start_date ? new Date(event.start_date) : null;

    return (
        <div className="event-card" onClick={() => onClick(event)}>
            <div className="event-header">
                <span className="event-type">
                    {event.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
                </span>
                <h3 className="event-title">{event.title}</h3>
            </div>

            <div className="event-body">
                <div className="event-info">
                    <div className="info-item">
                        <span className="info-icon">📅</span>
                        <span>{startDate ? startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🕐</span>
                        <span>{startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">📍</span>
                        <span>{location}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🏷️</span>
                        <span>{event.type ? capitalize(event.type) : 'N/A'}</span>
                    </div>
                </div>

                <p className="event-description">{event.desc}</p>

                <div className="event-footer">
                    <div className="participants">
                        <span>👥</span>
                        <span>{event.participant_count}{event.max_participants ? `/${event.max_participants}` : ''} registered</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EventModal({ event, onClose }) {
    const location = [event.building, event.room].filter(Boolean).join(', ') || 'TBD';
    const startDate = event.start_date ? new Date(event.start_date) : null;
    const agendas = Array.isArray(event.agendas) ? event.agendas : [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{event.title}</h3>
                    <span className="event-type" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        {event.visibility === 'public' ? '🌍 Public Event' : '🔒 Private Event'}
                    </span>
                </div>

                <div className="modal-body">
                    <div className="event-info" style={{ marginBottom: '1.5rem' }}>
                        <div className="info-item">
                            <span className="info-icon">📅</span>
                            <span>{startDate ? startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">🕐</span>
                            <span>{startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">📍</span>
                            <span>{location}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">🏷️</span>
                            <span>{event.type ? capitalize(event.type) : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">👥</span>
                            <span>{event.participant_count}{event.max_participants ? `/${event.max_participants}` : ''} participants registered</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>About This Event</h4>
                        <p style={{ color: '#666', lineHeight: 1.6 }}>{event.desc}</p>
                    </div>

                    {agendas.length > 0 && (
                        <div>
                            <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Agenda</h4>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {agendas.map((item, idx) => (
                                    <li key={idx} style={{
                                        padding: '0.75rem',
                                        background: '#f8f8f8',
                                        marginBottom: '0.5rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}>{idx + 1}</span>
                                        <span>{formatAgendaItem(item)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

function CalendarPage({ events }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
        }

        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
        }

        return days;
    };

    const hasEvent = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.some(e => e.start_date && e.start_date.split('T')[0] === dateStr);
    };

    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2 className="calendar-month">{monthName}</h2>
                <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>←</button>
                    <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
                    <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>→</button>
                </div>
            </div>

            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${hasEvent(day.date) ? 'has-event' : ''}`}
                    >
                        {day.day}
                        {hasEvent(day.date) && <div className="event-dot"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function CreateEventModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        title: '',
        desc: '',
        type: 'online',
        visibility: 'public',
        start_date: '',
        end_date: '',
        building: '',
        room: '',
        max_participants: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...formData };
            if (!payload.end_date) delete payload.end_date;
            if (!payload.building) delete payload.building;
            if (!payload.room) delete payload.room;
            if (payload.max_participants) {
                payload.max_participants = parseInt(payload.max_participants, 10);
            } else {
                delete payload.max_participants;
            }
            await onCreate(payload);
        } catch (err) {
            setError(formatApiError(err.data || {}));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create New Event</h3>
                    <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Fill in the details to create a new university event</p>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="create-event-grid">
                            <div className="form-group form-group-full">
                                <label className="form-label">Event Title *</label>
                                <input type="text" name="title" className="form-input" placeholder="Enter event title" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Description *</label>
                                <textarea name="desc" className="form-textarea" placeholder="Describe your event..." value={formData.desc} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Type *</label>
                                <select name="type" className="form-input" value={formData.type} onChange={handleChange}>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Visibility *</label>
                                <div className="event-type-toggle">
                                    <button type="button" className={`event-type-option ${formData.visibility === 'public' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}>🌍 Public</button>
                                    <button type="button" className={`event-type-option ${formData.visibility === 'private' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}>🔒 Private</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Start Date & Time *</label>
                                <input type="datetime-local" name="start_date" className="form-input" value={formData.start_date} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">End Date & Time</label>
                                <input type="datetime-local" name="end_date" className="form-input" value={formData.end_date} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Building</label>
                                <input type="text" name="building" className="form-input" placeholder="Building name" value={formData.building} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Room</label>
                                <input type="text" name="room" className="form-input" placeholder="Room number" value={formData.room} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Max Participants</label>
                                <input type="number" name="max_participants" className="form-input" placeholder="100" min="1" value={formData.max_participants} onChange={handleChange} />
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

ReactDOM.render(<App />, document.getElementById('root'));
