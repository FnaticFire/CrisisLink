'use client';

import './landing.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldAlert, MapPin, MessageSquare, Users, Zap,
  ChevronDown, ArrowRight, Radio, Clock, Heart, Activity,
  Smartphone, Bell, Navigation, CheckCircle2, Globe, Star,
  Menu, X
} from 'lucide-react';

/* ─────────────────────── Intersection Observer Hook ─────────────────────── */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.15, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, isInView };
}

/* ─────────────────────── Animated Counter ─────────────────────── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─────────────────────── Feature Data ─────────────────────── */
const FEATURES = [
  {
    icon: ShieldAlert,
    title: 'AI Emergency Detection',
    desc: 'Describe your situation and our Gemini AI instantly classifies severity, type, and generates life-saving instructions.',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    icon: Navigation,
    title: 'Real-Time Dispatch',
    desc: 'Alerts are routed to the nearest qualified responder — police, fire, hospital — within 30km radius automatically.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: MapPin,
    title: 'Live Tactical Map',
    desc: 'Split-screen tracking shows both survivor and responder locations with live distance updates and ETA.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: MessageSquare,
    title: 'Mission Chat',
    desc: 'Real-time communication between survivors and responders with AI safety guidance during active emergencies.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Users,
    title: 'Volunteer Network',
    desc: 'Civilians can toggle volunteer status and respond to community help requests within 10km radius.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Role-based alert filtering ensures responders only see emergencies matching their department expertise.',
    gradient: 'from-pink-500 to-rose-500',
  },
];

const ROLES = [
  { icon: '👤', title: 'Civilian', desc: 'Report emergencies, request volunteers, track responder arrival in real-time.' },
  { icon: '👮', title: 'Police', desc: 'Receive crime, accident & security alerts. Accept and navigate to emergencies.' },
  { icon: '🚒', title: 'Fire Dept', desc: 'Get fire & structural collapse alerts. Coordinate rescue operations.' },
  { icon: '🏥', title: 'Hospital', desc: 'Respond to medical emergencies & accidents. Ambulance dispatch integration.' },
  { icon: '🤝', title: 'Volunteer', desc: 'Community members helping with non-critical local requests nearby.' },
];

const STEPS = [
  { num: '01', title: 'Report Emergency', desc: 'Describe your situation in natural language. AI analyzes severity instantly.', icon: Smartphone },
  { num: '02', title: 'Smart Routing', desc: 'Alert is dispatched to the nearest qualified responder based on emergency type.', icon: Radio },
  { num: '03', title: 'Live Tracking', desc: 'Track responder location in real-time on a tactical split-screen map.', icon: MapPin },
  { num: '04', title: 'Resolution', desc: 'Coordinated response with chat, guidance, and status updates until resolved.', icon: CheckCircle2 },
];

/* ─────────────────────── Main Landing Page ─────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const navigateToApp = () => router.push('/login');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  // Sections with scroll reveal
  const hero = useInView();
  const problem = useInView();
  const features = useInView();
  const howItWorks = useInView();
  const roles = useInView();
  const stats = useInView();
  const cta = useInView();

  return (
    <div
      className="landing-page"
      onMouseMove={handleMouseMove}
      style={{ '--mouse-x': `${mousePos.x}px`, '--mouse-y': `${mousePos.y}px` } as React.CSSProperties}
    >
      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className={`landing-nav ${scrollY > 50 ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => scrollToSection('hero')}>
            <div className="brand-icon">
              <Shield size={20} />
            </div>
            <span className="brand-text">CrisisLink</span>
          </div>

          <div className="nav-links-desktop">
            <button onClick={() => scrollToSection('features')}>Features</button>
            <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button onClick={() => scrollToSection('roles')}>Roles</button>
            <button onClick={() => scrollToSection('stats')}>Impact</button>
          </div>

          <div className="nav-actions">
            <button className="nav-cta" onClick={navigateToApp}>
              Use Now <ArrowRight size={16} />
            </button>
            <button className="mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="mobile-menu">
            <button onClick={() => scrollToSection('features')}>Features</button>
            <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button onClick={() => scrollToSection('roles')}>Roles</button>
            <button onClick={() => scrollToSection('stats')}>Impact</button>
            <button className="mobile-cta" onClick={navigateToApp}>Use Now →</button>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section id="hero" ref={hero.ref} className="hero-section">
        {/* Animated Background */}
        <div className="hero-bg">
          <div className="hero-gradient-orb orb-1" />
          <div className="hero-gradient-orb orb-2" />
          <div className="hero-gradient-orb orb-3" />
          <div className="hero-grid" />
        </div>

        <div className={`hero-content ${hero.isInView ? 'animate-in' : ''}`}>
          <div className="hero-badge">
            <Zap size={14} />
            <span>AI-Powered Emergency Response</span>
          </div>

          <h1 className="hero-title">
            Every Second Counts.<br />
            <span className="hero-gradient-text">We Make Them Matter.</span>
          </h1>

          <p className="hero-subtitle">
            CrisisLink connects people in distress with the nearest emergency responders
            using AI detection, real-time tracking, and smart dispatch — saving lives
            when every second counts.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={navigateToApp}>
              <span>Use Now</span>
              <ArrowRight size={18} />
            </button>
            <button className="hero-btn-secondary" onClick={() => scrollToSection('features')}>
              Explore Features
            </button>
          </div>

          <div className="hero-scroll-hint" onClick={() => scrollToSection('problem')}>
            <span>Scroll to explore</span>
            <ChevronDown size={18} className="bounce-animation" />
          </div>
        </div>

        {/* Floating Elements */}
        <div className="hero-floating">
          <div className="float-card float-1">
            <ShieldAlert size={18} className="text-red-400" />
            <span>Emergency Detected</span>
          </div>
          <div className="float-card float-2">
            <Navigation size={18} className="text-blue-400" />
            <span>Responder 2.3 km away</span>
          </div>
          <div className="float-card float-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>Help Arriving</span>
          </div>
        </div>
      </section>

      {/* ═══════════ PROBLEM / SOLUTION ═══════════ */}
      <section id="problem" ref={problem.ref} className="problem-section">
        <div className={`section-content ${problem.isInView ? 'animate-in' : ''}`}>
          <div className="problem-grid">
            <div className="problem-left">
              <span className="section-label">The Problem</span>
              <h2 className="section-title">
                Emergencies Don't Wait.<br />
                <span className="text-red-400">Neither Should Help.</span>
              </h2>
              <p className="section-desc">
                In India, emergency response times average <strong>20-30 minutes</strong> in urban areas
                and significantly longer in rural regions. Disconnected systems, manual dispatch,
                and lack of real-time coordination cost lives every day.
              </p>
              <div className="problem-stats">
                <div className="p-stat">
                  <span className="p-stat-num">30min+</span>
                  <span className="p-stat-label">Avg Response Time</span>
                </div>
                <div className="p-stat">
                  <span className="p-stat-num">72%</span>
                  <span className="p-stat-label">Lack Real-time Tracking</span>
                </div>
              </div>
            </div>

            <div className="problem-right">
              <span className="section-label">The Solution</span>
              <h2 className="section-title">
                Smart. Instant.<br />
                <span className="landing-text-red">Life-Saving.</span>
              </h2>
              <p className="section-desc">
                CrisisLink uses <strong>Google Gemini AI</strong> to instantly analyze emergencies,
                automatically dispatch the right responder, and provide real-time tactical
                tracking — reducing response times to <strong>under 5 minutes</strong>.
              </p>
              <div className="solution-features">
                {['AI Classification', 'Auto Dispatch', 'Live Tracking', 'Mission Chat'].map((f, i) => (
                  <div key={i} className="solution-pill">
                    <CheckCircle2 size={14} className="text-red-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" ref={features.ref} className="features-section">
        <div className={`section-content ${features.isInView ? 'animate-in' : ''}`}>
          <span className="section-label center">Core Features</span>
          <h2 className="section-title center">
            Built for <span className="landing-text-red">Real Emergencies</span>
          </h2>
          <p className="section-desc center" style={{ maxWidth: 560, margin: '0 auto 48px' }}>
            Every feature is designed with one goal — getting help to people faster.
          </p>

          <div className="features-grid">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="feature-card"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`feature-icon bg-gradient-to-br ${feat.gradient}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="feature-title">{feat.title}</h3>
                  <p className="feature-desc">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" ref={howItWorks.ref} className="how-section">
        <div className={`section-content ${howItWorks.isInView ? 'animate-in' : ''}`}>
          <span className="section-label center">How It Works</span>
          <h2 className="section-title center">
            From Crisis to <span className="landing-text-red">Resolution</span>
          </h2>
          <p className="section-desc center" style={{ maxWidth: 500, margin: '0 auto 56px' }}>
            A simple 4-step process that saves lives.
          </p>

          <div className="steps-container">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="step-card" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="step-num">{step.num}</div>
                  <div className="step-icon-wrap">
                    <Icon size={24} />
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                  {i < STEPS.length - 1 && <div className="step-connector" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ ROLES ═══════════ */}
      <section id="roles" ref={roles.ref} className="roles-section">
        <div className={`section-content ${roles.isInView ? 'animate-in' : ''}`}>
          <span className="section-label center">User Roles</span>
          <h2 className="section-title center">
            One Platform, <span className="landing-text-red">Multiple Roles</span>
          </h2>
          <p className="section-desc center" style={{ maxWidth: 520, margin: '0 auto 48px' }}>
            Whether you&apos;re a citizen, first responder, or volunteer — CrisisLink adapts to your role.
          </p>

          <div className="roles-grid">
            {ROLES.map((role, i) => (
              <div key={i} className="role-card" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="role-emoji">{role.icon}</span>
                <h3 className="role-title">{role.title}</h3>
                <p className="role-desc">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section id="stats" ref={stats.ref} className="stats-section">
        <div className={`section-content ${stats.isInView ? 'animate-in' : ''}`}>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num"><AnimatedCounter end={24} />/7</div>
              <div className="stat-label">Always Available</div>
              <Clock size={20} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div className="stat-num">&lt;<AnimatedCounter end={5} />min</div>
              <div className="stat-label">Avg Response Time</div>
              <Activity size={20} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div className="stat-num"><AnimatedCounter end={4} /></div>
              <div className="stat-label">Responder Types</div>
              <Users size={20} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div className="stat-num"><AnimatedCounter end={30} />km</div>
              <div className="stat-label">Coverage Radius</div>
              <Globe size={20} className="stat-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TECH STACK ═══════════ */}
      <section className="tech-section">
        <div className="section-content">
          <span className="section-label center">Powered By</span>
          <div className="tech-pills">
            {['Google Gemini AI', 'Firebase Realtime', 'Next.js 16', 'Leaflet Maps', 'Zustand', 'TypeScript'].map((t, i) => (
              <div key={i} className="tech-pill">
                <Star size={12} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section ref={cta.ref} className="cta-section">
        <div className={`section-content ${cta.isInView ? 'animate-in' : ''}`}>
          <div className="cta-card">
            <div className="cta-bg-orbs">
              <div className="cta-orb cta-orb-1" />
              <div className="cta-orb cta-orb-2" />
            </div>
            <div className="cta-inner">
              <h2 className="cta-title">
                Ready to Make a<br />
                <span className="landing-text-gradient">Difference?</span>
              </h2>
              <p className="cta-desc">
                Join CrisisLink today and be part of a smarter, faster emergency response network.
              </p>
              <button className="cta-btn" onClick={navigateToApp}>
                <span>Start Using CrisisLink</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield size={18} />
            <span>CrisisLink</span>
          </div>
          <p className="footer-text">
            Built for Google Developer Groups Hackathon 2026 — Saving lives with AI-powered emergency coordination.
          </p>
          <div className="footer-links">
            <button onClick={() => scrollToSection('features')}>Features</button>
            <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button onClick={() => scrollToSection('roles')}>Roles</button>
            <button onClick={navigateToApp}>Use Now</button>
          </div>
          <div className="footer-divider" />
          <p className="footer-copy">© 2026 CrisisLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
