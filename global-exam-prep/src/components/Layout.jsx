import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, User, LogOut, LogIn, ChevronRight, Menu, X, Home, Trophy, CreditCard, MessageSquare, Shield, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CATALOG_DOMAINS } from '../data/catalogDomains';
import courseMapping from '../data/courseMapping.json';
import './Layout.css';
import PageLoading from './PageLoading';

export default function Layout() {
    const { currentUser, logout, isAdmin, authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hoveredNav, setHoveredNav] = useState(null);
    const searchRef = useRef(null);

    // Close suggestions on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu and suggestions on route change
    useEffect(() => {
        setShowSuggestions(false);
        setSearchQuery('');
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Departments + courses only — do not import mockData.js (subjects live in Supabase).
    const searchableItems = useMemo(() => {
        const items = [];
        CATALOG_DOMAINS.forEach(domain => {
            items.push({ type: 'Domain', id: domain.id, title: domain.title, path: `/domains/${domain.id}/courses` });
        });
        courseMapping.forEach(course => {
            items.push({
                type: 'Course',
                id: String(course.courseId),
                title: course.courseName,
                path: `/courses/${course.courseId}/subjects`,
                domainTitle: course.domainName,
            });
        });
        return items;
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase().replace(/[\.\s\-]/g, '');

        // Prioritize exact matches and sort by type to ensure Domain/Course appear before Subjects
        let exactMatches = [];
        let partialMatches = [];

        searchableItems.forEach(item => {
            const itemTitle = item.title.toLowerCase().replace(/[\.\s\-]/g, '');
            const itemId = item.id.toLowerCase().replace(/[\.\s\-]/g, '');

            if (itemTitle.includes(query) || itemId.includes(query)) {
                if (itemTitle === query || itemId === query) {
                    exactMatches.push(item);
                } else {
                    partialMatches.push(item);
                }
            }
        });

        const typeOrder = { 'Domain': 1, 'Course': 2, 'Subject': 3 };

        exactMatches.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
        partialMatches.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

        return [...exactMatches, ...partialMatches].slice(0, 6);
    }, [searchQuery, searchableItems]);

    async function handleLogout() {
        try {
            await logout();
            navigate('/signup?mode=login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    }


    // Role-dependent navbar. Students (and guests) keep Home / Subscriptions.
    // Authenticated admins: Dashboard + Courses in those slots; Leaderboards and
    // Feedback stay. Never derived from email or storage — AuthContext.isAdmin only.
    const showAdminNav = !authLoading && !!currentUser && isAdmin;
    const navItems = showAdminNav
        ? [
            { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
            { id: 'courses', label: 'Courses', path: '/admin/courses' },
            { id: 'leaderboards', label: 'Leaderboards', path: '/leaderboards' },
            { id: 'feedback', label: 'Feedback', path: '/feedback' },
        ]
        : [
            { id: 'home', label: 'Home', path: '/' },
            { id: 'leaderboards', label: 'Leaderboards', path: '/leaderboards' },
            { id: 'feedback', label: 'Feedback', path: '/feedback' },
            { id: 'subscriptions', label: 'Subscriptions', path: '/subscriptions' },
        ];

    const navIcon = {
        home: Home,
        dashboard: LayoutDashboard,
        courses: BookOpen,
        leaderboards: Trophy,
        feedback: MessageSquare,
        subscriptions: CreditCard,
    };
    const navIconColor = {
        home: '#D8CBB3',
        dashboard: '#D8CBB3',
        courses: '#D8CBB3',
        leaderboards: '#D8CBB3',
        feedback: '#D8CBB3',
        subscriptions: '#D8CBB3',
    };

    const getActiveNavId = () => {
        if (showAdminNav) {
            if (location.pathname.startsWith('/dashboard')) return 'dashboard';
            if (location.pathname.startsWith('/admin/courses')) return 'courses';
        } else if (location.pathname === '/' ||
            location.pathname.startsWith('/domains') ||
            location.pathname.startsWith('/courses') ||
            location.pathname.startsWith('/exams')) return 'home';
        if (location.pathname.startsWith('/leaderboards')) return 'leaderboards';
        if (location.pathname.startsWith('/feedback')) return 'feedback';
        if (location.pathname.startsWith('/subscriptions')) return 'subscriptions';
        return null;
    };
    const activeNavId = getActiveNavId();
    const activeBackgroundId = hoveredNav || activeNavId;

    return (
        <>
            <nav className="pm-nav" style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'rgba(15, 17, 21, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--glass-border)',
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '64px',
                    gap: '0.75rem',
                }}>
                    {/* Logo */}
                    <Link to={showAdminNav ? '/dashboard' : '/'} className="pm-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, textDecoration: 'none' }}>
                        <div className="pm-logo__mark" style={{
                            background: '#D8CBB3',
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BookOpen size={22} color="#493326" />
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#F5F2EB' }}>
                            Prep<span style={{ color: '#D8CBB3' }}>Master</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div
                        className="nav-desktop"
                        onMouseLeave={() => setHoveredNav(null)}
                        style={{
                            display: 'flex',
                            gap: '0.35rem',
                            alignItems: 'center',
                            flexShrink: 0,
                            padding: '0.35rem 0.55rem',
                            background: '#242421',
                            border: '1px solid #3A3A36',
                            borderRadius: 'var(--radius-full)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        {navItems.map(item => {
                            const isCurrent = activeNavId === item.id;
                            const showPill = activeBackgroundId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className="nav-desktop-item"
                                    onMouseEnter={() => setHoveredNav(item.id)}
                                >
                                    {showPill && (
                                        <div className="nav-active-pill" aria-hidden="true" />
                                    )}
                                    <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                                        {item.isButton ? (
                                            <button
                                                onClick={handleContactClick}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    padding: '0 1.25rem',
                                                    lineHeight: '1',
                                                    fontFamily: 'inherit',
                                                    color: showPill ? '#F5F0E7' : '#D8CBB3',
                                                    fontWeight: isCurrent ? 700 : 500,
                                                    fontSize: '0.92rem',
                                                    cursor: 'pointer',
                                                    transition: 'color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {item.label}
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                style={{
                                                    padding: '0 1.25rem',
                                                    lineHeight: '1',
                                                    fontFamily: 'inherit',
                                                    color: showPill ? '#F5F0E7' : '#D8CBB3',
                                                    fontWeight: isCurrent ? 700 : 500,
                                                    fontSize: '0.92rem',
                                                    textDecoration: 'none',
                                                    transition: 'color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {item.label}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Search */}
                        <div ref={searchRef} style={{ position: 'relative' }}>
                            <form
                                className="pm-nav-search-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (searchQuery.trim()) {
                                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                                        setShowSuggestions(false);
                                    }
                                }}
                            >
                                <button
                                    type="submit"
                                    className="pm-nav-search-btn"
                                    title="Search"
                                    aria-label="Submit Search"
                                >
                                    <Search size={16} color="#493326" style={{ minWidth: '16px' }} />
                                </button>
                                <input
                                    name="search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search courses or subjects..."
                                    className="pm-nav-search-input"
                                />
                            </form>

                            {showSuggestions && searchQuery.trim() !== '' && (
                                <div className="pm-nav-suggestions" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    width: 'clamp(300px, 400px, 90vw)',
                                    background: '#FFFFFF',
                                    border: '1px solid #DDD5C7',
                                    boxShadow: '0 12px 32px rgba(30, 30, 28, 0.12)',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    zIndex: 100
                                }}>
                                    {filteredItems.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {filteredItems.map(item => (
                                                <Link
                                                    key={item.id + item.type}
                                                    to={item.path}
                                                    className="pm-nav-suggestion-item"
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        textDecoration: 'none',
                                                        transition: 'background var(--transition-fast)'
                                                    }}
                                                    onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#1E1E1C', fontSize: '0.9rem' }}>{item.title}</span>
                                                        <span style={{ fontSize: '0.72rem', color: '#806B57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {item.type}{item.courseTitle ? ` • ${item.courseTitle}` : item.domainTitle ? ` • ${item.domainTitle}` : ''}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={14} color="#806B57" />
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: '#806B57', fontSize: '0.875rem' }}>
                                            No results found for "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Auth Buttons */}
                        {currentUser ? (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Link to="/dashboard" style={{
                                    background: '#242421',
                                    border: '1px solid #493326',
                                    padding: '0.45rem',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all var(--transition-normal)'
                                }} title="Dashboard" aria-label="Go to Dashboard">
                                    <User size={18} color="#D8CBB3" />
                                </Link>
                                <button onClick={handleLogout} style={{
                                    background: 'transparent',
                                    border: '1px solid #493326',
                                    padding: '0.45rem',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all var(--transition-normal)',
                                    cursor: 'pointer'
                                }} title="Log Out" aria-label="Log Out of Account">
                                    <LogOut size={18} color="#9B2C2C" />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                                <Link to="/signup?mode=login" className="pm-btn-login">
                                    <LogIn size={15} color="#F5F0E7" /> Log In
                                </Link>
                                <Link to="/signup?mode=signup" className="pm-btn-signup">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="nav-mobile-toggle"
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="pm-mobile-drawer">
                        {/* Mobile Search */}
                        <div ref={searchRef} style={{ position: 'relative' }}>
                            <form
                                className="pm-mobile-search-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (searchQuery.trim()) {
                                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                                        setShowSuggestions(false);
                                        setMobileMenuOpen(false);
                                    }
                                }}
                            >
                                <button
                                    type="submit"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                    title="Search"
                                >
                                    <Search size={16} color="#493326" />
                                </button>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search courses or subjects..."
                                />
                            </form>
                            {showSuggestions && searchQuery.trim() !== '' && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    border: '1px solid #D8CBB3',
                                    boxShadow: '0 8px 24px rgba(73, 51, 38, 0.1)',
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    zIndex: 100,
                                }}>
                                    {filteredItems.length > 0 ? filteredItems.map(item => (
                                        <Link
                                            key={item.id + item.type}
                                            to={item.path}
                                            style={{
                                                padding: '0.65rem',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                textDecoration: 'none'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = '#F5F0E7'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            onClick={() => { setShowSuggestions(false); setSearchQuery(''); setMobileMenuOpen(false); }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1E1E1C' }}>{item.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#806B57', textTransform: 'uppercase' }}>{item.type}</div>
                                            </div>
                                            <ChevronRight size={13} color="#806B57" />
                                        </Link>
                                    )) : (
                                        <div style={{ padding: '0.75rem', textAlign: 'center', color: '#806B57', fontSize: '0.85rem' }}>No results found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {navItems.map((item) => {
                            const Icon = navIcon[item.id] || Home;
                            const isActive = activeNavId === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`pm-mobile-nav-item ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Icon size={18} color={isActive ? '#F5F0E7' : '#493326'} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        <div className="pm-mobile-auth">
                            {currentUser ? (
                                <>
                                    {isAdmin && (
                                        <Link to="/admin/syllabus" style={{
                                            width: '100%', textAlign: 'center', padding: '0.75rem',
                                            background: '#EAE1D3', borderRadius: '10px',
                                            border: '1px solid #D8CBB3', color: '#493326',
                                            fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            marginBottom: '0.5rem', textDecoration: 'none'
                                        }}>
                                            <Shield size={16} /> Syllabus Admin
                                        </Link>
                                    )}
                                    <Link to="/dashboard" style={{
                                        flex: 1, textAlign: 'center', padding: '0.75rem',
                                        background: '#493326', borderRadius: '10px',
                                        border: '1px solid #493326', color: '#F5F0E7',
                                        fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        textDecoration: 'none'
                                    }}>
                                        <User size={16} /> Dashboard
                                    </Link>
                                    <button onClick={handleLogout} style={{
                                        flex: 1, padding: '0.75rem',
                                        background: '#EAE1D3', borderRadius: '10px',
                                        border: '1px solid #D8CBB3', color: '#9B2C2C',
                                        fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}>
                                        <LogOut size={16} /> Log Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/signup?mode=login" className="pm-mobile-btn-login" onClick={() => setMobileMenuOpen(false)}>
                                        <LogIn size={15} /> Log In
                                    </Link>
                                    <Link to="/signup?mode=signup" className="pm-mobile-btn-signup" onClick={() => setMobileMenuOpen(false)}>
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <main className="pm-main" style={{ flex: 1, padding: '2rem 0' }}>
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Suspense fallback={<PageLoading message="Loading page…" />}>
                        <Outlet />
                    </Suspense>
                </motion.div>
            </main>

            <footer className="pm-footer">
                <div className="pm-footer__inner">
                    <div className="pm-footer__top">
                        <div className="pm-footer__brand">
                            <div className="pm-footer__brand-title">
                                <BookOpen size={20} color="#D8CBB3" />
                                <span>PrepMaster</span>
                            </div>
                            <p className="pm-footer__tagline">
                                A modern academic study environment shaped around university syllabuses and structured examination practice.
                            </p>
                        </div>
                        <div className="pm-footer__links-group">
                            <div className="pm-footer__links-col">
                                <span className="pm-footer__col-title">Navigation</span>
                                <Link to="/" className="pm-footer__link">Home</Link>
                                <Link to="/leaderboards" className="pm-footer__link">Leaderboards</Link>
                                <Link to="/feedback" className="pm-footer__link">Feedback</Link>
                            </div>
                            <div className="pm-footer__links-col">
                                <span className="pm-footer__col-title">Study Resources</span>
                                <Link to="/guide" className="pm-footer__link">User Guide</Link>
                                <Link to="/dashboard" className="pm-footer__link">Dashboard</Link>
                                <Link to="/subscriptions" className="pm-footer__link">Subscriptions</Link>
                            </div>
                        </div>
                    </div>
                    <div className="pm-footer__bottom">
                        <span className="pm-footer__stationery-note">
                            ✏️ Focused digital study desk & examination companion
                        </span>
                        <span>© {new Date().getFullYear()} PrepMaster. All rights reserved.</span>
                    </div>
                </div>
            </footer>

            <style>{`
                @media (max-width: 900px) {
                    .nav-desktop { display: none !important; }
                    .nav-mobile-toggle { display: flex !important; }
                }
                @media (min-width: 901px) {
                    .nav-mobile-toggle { display: none !important; }
                    .nav-desktop { display: flex !important; }
                }
            `}</style>
        </>
    );
}