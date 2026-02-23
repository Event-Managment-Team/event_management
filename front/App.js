const { useState, useEffect } = React;

// Mock Data
const MOCK_USERS = [
    { email: 'student@university.edu', password: 'student123', role: 'student', name: 'Alex Johnson' },
    { email: 'staff@university.edu', password: 'staff123', role: 'staff', name: 'Dr. Sarah Mitchell' },
    { email: 'admin@university.edu', password: 'admin123', role: 'admin', name: 'Admin User' }
];

const MOCK_EVENTS = [
    {
        id: 1,
        title: 'Annual Tech Summit 2025',
        description: 'Join us for an exciting day of innovation, technology discussions, and networking opportunities with industry leaders.',
        date: '2025-03-15',
        time: '09:00 AM',
        location: 'Main Auditorium, Building A',
        type: 'public',
        participants: 145,
        maxParticipants: 200,
        agenda: ['Opening Keynote - Future of AI', 'Workshop: Machine Learning Basics', 'Panel Discussion: Tech Careers', 'Networking Lunch', 'Closing Remarks']
    },
    {
        id: 2,
        title: 'Faculty Research Symposium',
        description: 'Exclusive presentation of cutting-edge research findings by our distinguished faculty members across various disciplines.',
        date: '2025-03-20',
        time: '02:00 PM',
        location: 'Research Center, Room 301',
        type: 'private',
        participants: 32,
        maxParticipants: 50,
        agenda: ['Welcome Address', 'Research Presentations - Session 1', 'Coffee Break', 'Research Presentations - Session 2', 'Q&A and Discussion']
    },
    {
        id: 3,
        title: 'Student Innovation Showcase',
        description: 'Students present their innovative projects and prototypes to the university community. Featuring awards and prizes!',
        date: '2025-03-25',
        time: '10:00 AM',
        location: 'Innovation Lab, Building C',
        type: 'public',
        participants: 89,
        maxParticipants: 150,
        agenda: ['Registration & Setup', 'Project Demonstrations Round 1', 'Lunch Break', 'Project Demonstrations Round 2', 'Judging & Awards Ceremony']
    },
    {
        id: 4,
        title: 'Career Development Workshop',
        description: 'Essential skills workshop covering resume building, interview techniques, networking strategies, and career planning.',
        date: '2025-04-05',
        time: '03:00 PM',
        location: 'Career Center, Hall B',
        type: 'public',
        participants: 67,
        maxParticipants: 100,
        agenda: ['Resume & CV Workshop', 'LinkedIn Profile Optimization', 'Mock Interview Sessions', 'Networking Tips & Strategies', 'Career Path Planning']
    },
    {
        id: 5,
        title: 'Department Strategy Meeting',
        description: 'Strategic planning session for department heads and senior staff members to discuss future initiatives.',
        date: '2025-04-10',
        time: '11:00 AM',
        location: 'Executive Board Room',
        type: 'private',
        participants: 15,
        maxParticipants: 25,
        agenda: ['Budget Review Q1', 'Strategic Goals for 2025-2026', 'Resource Allocation', 'Action Planning', 'Next Steps']
    },
    {
        id: 6,
        title: 'Web Development Bootcamp',
        description: 'Intensive 3-day bootcamp covering HTML, CSS, JavaScript, React, and modern web development practices.',
        date: '2025-04-15',
        time: '09:00 AM',
        location: 'Computer Lab 5, Building D',
        type: 'public',
        participants: 78,
        maxParticipants: 80,
        agenda: ['HTML & CSS Fundamentals', 'JavaScript Essentials', 'React Introduction', 'Building Your First App', 'Deployment & Best Practices']
    },
    {
        id: 7,
        title: 'Mental Health Awareness Week',
        description: 'Campus-wide initiative promoting mental health awareness with workshops, counseling sessions, and wellness activities.',
        date: '2025-04-18',
        time: '10:00 AM',
        location: 'Student Wellness Center',
        type: 'public',
        participants: 134,
        maxParticipants: 200,
        agenda: ['Opening Session', 'Stress Management Workshop', 'Group Meditation', 'Mental Health Resources Fair', 'Community Circle']
    },
    {
        id: 8,
        title: 'Alumni Networking Night',
        description: 'Connect with successful alumni from various industries. Great opportunity for mentorship and career guidance.',
        date: '2025-04-22',
        time: '06:00 PM',
        location: 'University Club, Main Campus',
        type: 'public',
        participants: 95,
        maxParticipants: 150,
        agenda: ['Welcome Reception', 'Alumni Spotlight Talks', 'Speed Networking Sessions', 'Industry Breakout Groups', 'Closing Mixer']
    },
    {
        id: 9,
        title: 'Grant Writing Workshop',
        description: 'Staff development session focused on effective grant proposal writing and securing research funding.',
        date: '2025-04-28',
        time: '01:00 PM',
        location: 'Faculty Development Center',
        type: 'private',
        participants: 22,
        maxParticipants: 30,
        agenda: ['Grant Landscape Overview', 'Proposal Structure & Components', 'Budget Development', 'Review & Feedback Session', 'Submission Best Practices']
    },
    {
        id: 10,
        title: 'Spring Music Festival',
        description: 'Celebrate spring with live performances from student bands, orchestras, and solo artists. Food trucks and activities!',
        date: '2025-05-01',
        time: '12:00 PM',
        location: 'University Green',
        type: 'public',
        participants: 287,
        maxParticipants: 500,
        agenda: ['Opening Performance', 'Student Band Showcase', 'Food & Activities Break', 'Orchestra Performance', 'Headliner & Closing']
    },
    {
        id: 11,
        title: 'Cybersecurity Seminar',
        description: 'Learn about the latest cybersecurity threats, protection strategies, and best practices for digital safety.',
        date: '2025-05-05',
        time: '02:00 PM',
        location: 'Tech Center Auditorium',
        type: 'public',
        participants: 56,
        maxParticipants: 120,
        agenda: ['Current Threat Landscape', 'Password Security & 2FA', 'Phishing Prevention', 'Data Protection Strategies', 'Q&A with Security Experts']
    },
    {
        id: 12,
        title: 'Diversity & Inclusion Forum',
        description: 'Open forum discussing diversity, equity, and inclusion initiatives on campus. All community members welcome.',
        date: '2025-05-10',
        time: '04:00 PM',
        location: 'Student Union, Room 201',
        type: 'public',
        participants: 103,
        maxParticipants: 150,
        agenda: ['Welcome & Overview', 'Panel Discussion', 'Breakout Sessions', 'Community Feedback', 'Action Items & Next Steps']
    },
    {
        id: 13,
        title: 'Academic Senate Meeting',
        description: 'Monthly academic senate meeting for faculty representatives to discuss curriculum and policy matters.',
        date: '2025-05-12',
        time: '03:00 PM',
        location: 'Senate Chambers, Admin Building',
        type: 'private',
        participants: 28,
        maxParticipants: 40,
        agenda: ['Previous Minutes Approval', 'Curriculum Committee Report', 'New Course Proposals', 'Policy Updates', 'Open Discussion']
    },
    {
        id: 14,
        title: 'Entrepreneurship Pitch Competition',
        description: 'Student startups pitch their business ideas to judges and investors. $10,000 in prizes available!',
        date: '2025-05-18',
        time: '10:00 AM',
        location: 'Business School Auditorium',
        type: 'public',
        participants: 125,
        maxParticipants: 200,
        agenda: ['Competition Rules & Format', 'Pitch Round 1 (10 teams)', 'Break & Networking', 'Pitch Round 2 (Finalists)', 'Winner Announcement']
    },
    {
        id: 15,
        title: 'Summer Research Kickoff',
        description: 'Launch event for summer research programs featuring presentations from research leads and team assignments.',
        date: '2025-05-25',
        time: '09:00 AM',
        location: 'Research Building, Main Hall',
        type: 'public',
        participants: 71,
        maxParticipants: 100,
        agenda: ['Program Overview', 'Research Project Presentations', 'Lab Tours', 'Team Assignments', 'Safety Training & Resources']
    }
];

// App Component
function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('home');
    const [events, setEvents] = useState(MOCK_EVENTS);
    const [filter, setFilter] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [registeredEvents, setRegisteredEvents] = useState([]);

    const handleLogin = (email, password) => {
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user);
            setCurrentPage('events');
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('home');
        setRegisteredEvents([]);
    };

    const handleRegister = (eventId) => {
        if (!registeredEvents.includes(eventId)) {
            setRegisteredEvents([...registeredEvents, eventId]);
            setEvents(events.map(e =>
                e.id === eventId ? { ...e, participants: e.participants + 1 } : e
            ));
        }
    };

    const handleCreateEvent = (newEvent) => {
        const event = {
            ...newEvent,
            id: events.length + 1,
            participants: 0
        };
        setEvents([event, ...events]);
        setShowCreateModal(false);
    };

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.type === filter);

    return (
        <div className="app-container">
            {currentUser && <Navbar
                currentUser={currentUser}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={handleLogout}
            />}

            {!currentUser ? (
                <LoginPage onLogin={handleLogin} />
            ) : (
                <div className="main-content">
                    {currentPage === 'events' && (
                        <EventsPage
                            events={filteredEvents}
                            filter={filter}
                            setFilter={setFilter}
                            currentUser={currentUser}
                            registeredEvents={registeredEvents}
                            onRegister={handleRegister}
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

                    {currentPage === 'admin' && currentUser.role === 'admin' && (
                        <AdminPage events={events} users={MOCK_USERS} />
                    )}

                    {showModal && selectedEvent && (
                        <EventModal
                            event={selectedEvent}
                            isRegistered={registeredEvents.includes(selectedEvent.id)}
                            onClose={() => setShowModal(false)}
                            onRegister={() => {
                                handleRegister(selectedEvent.id);
                                setShowModal(false);
                            }}
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

// Navbar Component
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
                    {currentUser.role === 'admin' && (
                        <button
                            className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('admin')}
                        >
                            Admin Panel
                        </button>
                    )}
                    <button className="nav-btn btn-logout" onClick={onLogout}>
                        Logout ({currentUser.name})
                    </button>
                </div>
            </div>
        </nav>
    );
}

// Login Page Component
function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!email.includes('@university.edu')) {
            setError('Please use a valid university email address');
            return;
        }

        const success = onLogin(email, password);
        if (!success) {
            setError('Invalid email or password');
        }
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
                    <div className="auth-header">
                        <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
                        <p>Use your university email to continue</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">University Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your.email@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary">
                            {isRegister ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        {isRegister ? "Already have an account? " : "Don't have an account? "}
                        <a className="auth-link" onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? 'Sign In' : 'Register'}
                        </a>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid rgba(102, 126, 234, 0.1)' }}>
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

// Events Page Component
function EventsPage({ events, filter, setFilter, currentUser, registeredEvents, onRegister, onEventClick, onCreateClick }) {
    return (
        <>
            <div className="events-header">
                <h2>Upcoming Events</h2>
                {currentUser.role === 'admin' && (
                    <button className="btn-create" onClick={onCreateClick}>+ Create Event</button>
                )}
            </div>

            <div className="events-filters">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Events</button>
                <button className={`filter-btn ${filter === 'public' ? 'active' : ''}`} onClick={() => setFilter('public')}>Public Events</button>
                <button className={`filter-btn ${filter === 'private' ? 'active' : ''}`} onClick={() => setFilter('private')}>Private Events</button>
            </div>

            {events.length === 0 ? (
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
                            isRegistered={registeredEvents.includes(event.id)}
                            onRegister={onRegister}
                            onClick={onEventClick}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

// Event Card Component
function EventCard({ event, isRegistered, onRegister, onClick }) {
    return (
        <div className="event-card" onClick={() => onClick(event)}>
            <div className="event-header">
                <span className="event-type">
                    {event.type === 'public' ? '🌍 Public' : '🔒 Private'}
                </span>
                <h3 className="event-title">{event.title}</h3>
            </div>

            <div className="event-body">
                <div className="event-info">
                    <div className="info-item">
                        <span className="info-icon">📅</span>
                        <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🕐</span>
                        <span>{event.time}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">📍</span>
                        <span>{event.location}</span>
                    </div>
                </div>

                <p className="event-description">{event.description}</p>

                <div className="event-footer">
                    <div className="participants">
                        <span>👥</span>
                        <span>{event.participants}/{event.maxParticipants} registered</span>
                    </div>
                    <button
                        className={`btn-register ${isRegistered ? 'btn-registered' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isRegistered) onRegister(event.id);
                        }}
                    >
                        {isRegistered ? '✓ Registered' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Event Modal Component
function EventModal({ event, isRegistered, onClose, onRegister }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{event.title}</h3>
                    <span className="event-type" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        {event.type === 'public' ? '🌍 Public Event' : '🔒 Private Event'}
                    </span>
                </div>

                <div className="modal-body">
                    <div className="event-info" style={{ marginBottom: '1.5rem' }}>
                        <div className="info-item">
                            <span className="info-icon">📅</span>
                            <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">🕐</span>
                            <span>{event.time}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">📍</span>
                            <span>{event.location}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">👥</span>
                            <span>{event.participants}/{event.maxParticipants} participants registered</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>About This Event</h4>
                        <p style={{ color: '#666', lineHeight: 1.6 }}>{event.description}</p>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Agenda</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {event.agenda.map((item, idx) => (
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
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                    {!isRegistered && (
                        <button className="btn-primary" onClick={onRegister}>
                            Register for Event
                        </button>
                    )}
                    {isRegistered && (
                        <div style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(46, 204, 113, 0.1)',
                            color: '#2ecc71',
                            borderRadius: '10px',
                            fontWeight: 600
                        }}>
                            ✓ You're registered!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Calendar Page Component
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
        return events.some(e => e.date === dateStr);
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

// Create Event Modal Component
function CreateEventModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        type: 'public',
        maxParticipants: 100
    });
    const [agenda, setAgenda] = useState([]);
    const [newAgendaItem, setNewAgendaItem] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAgenda = () => {
        if (newAgendaItem.trim()) {
            setAgenda([...agenda, newAgendaItem.trim()]);
            setNewAgendaItem('');
        }
    };

    const handleRemoveAgenda = (index) => {
        setAgenda(agenda.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate({ ...formData, agenda: agenda.length > 0 ? agenda : ['Event Program'] });
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
                    <form onSubmit={handleSubmit}>
                        <div className="create-event-grid">
                            <div className="form-group form-group-full">
                                <label className="form-label">Event Title *</label>
                                <input type="text" name="title" className="form-input" placeholder="Enter event title" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Description *</label>
                                <textarea name="description" className="form-textarea" placeholder="Describe your event..." value={formData.description} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Date *</label>
                                <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Time *</label>
                                <input type="time" name="time" className="form-input" value={formData.time} onChange={handleChange} required />
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Location *</label>
                                <input type="text" name="location" className="form-input" placeholder="Building, Room Number" value={formData.location} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Type *</label>
                                <div className="event-type-toggle">
                                    <button type="button" className={`event-type-option ${formData.type === 'public' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, type: 'public' }))}>🌍 Public</button>
                                    <button type="button" className={`event-type-option ${formData.type === 'private' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, type: 'private' }))}>🔒 Private</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Max Participants *</label>
                                <input type="number" name="maxParticipants" className="form-input" placeholder="100" min="1" value={formData.maxParticipants} onChange={handleChange} required />
                            </div>

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
                                        <input
                                            type="text"
                                            className="agenda-input"
                                            placeholder="Add agenda item (e.g., 'Welcome Speech')"
                                            value={newAgendaItem}
                                            onChange={(e) => setNewAgendaItem(e.target.value)}
                                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAgenda(); } }}
                                        />
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

// Admin Page Component
function AdminPage({ events, users }) {
    const totalEvents = events.length;
    const publicEvents = events.filter(e => e.type === 'public').length;
    const privateEvents = events.filter(e => e.type === 'private').length;
    const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0);

    return (
        <>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Admin Dashboard</h2>
            </div>

            <div className="admin-dashboard">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📅</div>
                    <div className="stat-value">{totalEvents}</div>
                    <div className="stat-label">Total Events</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>🌍</div>
                    <div className="stat-value">{publicEvents}</div>
                    <div className="stat-label">Public Events</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>🔒</div>
                    <div className="stat-value">{privateEvents}</div>
                    <div className="stat-label">Private Events</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>👥</div>
                    <div className="stat-value">{totalParticipants}</div>
                    <div className="stat-label">Total Participants</div>
                </div>
            </div>

            <div className="admin-table">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', marginBottom: '1.5rem' }}>Registered Users</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>
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
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Participants</th>
                                <th>Capacity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td style={{ fontWeight: 600 }}>{event.title}</td>
                                    <td><span className={`badge badge-${event.type}`}>{event.type.toUpperCase()}</span></td>
                                    <td>{new Date(event.date).toLocaleDateString()}</td>
                                    <td>{event.participants}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(event.participants / event.maxParticipants) * 100}%`, height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', transition: 'width 0.3s ease' }}></div>
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

// Render App
ReactDOM.render(<App />, document.getElementById('root'));
