import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import trainerImage from '../assets/Trainer.png' // Adjusted path
import trainerImage2 from '../assets/Trainer-2.JPEG' // Adjusted path
import '../App.css' // Adjusted path
import ContactApplicationForm from '../components/ContactApplicationForm'

/** Shown on every full load / refresh; skipped only when user prefers reduced motion. */
function shouldShowIntroSplash(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

const SPLASH_LOGO = 'HXTRAININGCLUB'

function HomePage() {
  const philosophySectionRef = useRef<HTMLElement>(null)
  const philosophyBgRef = useRef<HTMLDivElement>(null)

  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [showFloatingCta, setShowFloatingCta] = useState<boolean>(false)

  const [splashActive, setSplashActive] = useState(shouldShowIntroSplash)
  const [splashExiting, setSplashExiting] = useState(false)

  useLayoutEffect(() => {
    if (!splashActive) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [splashActive])

  useEffect(() => {
    if (!splashActive) return
    const holdMs = 1400
    const exitMs = 900
    const t1 = window.setTimeout(() => setSplashExiting(true), holdMs)
    const t2 = window.setTimeout(() => {
      setSplashActive(false)
      setSplashExiting(false)
    }, holdMs + exitMs)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [splashActive])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      // Show floating CTA after scrolling past hero, hide near contact section
      const contactSection = document.getElementById('contact')
      const heroHeight = window.innerHeight
      const contactTop = contactSection?.offsetTop || Infinity
      const scrollPosition = window.scrollY + window.innerHeight

      setShowFloatingCta(
        window.scrollY > heroHeight * 0.5 &&
        scrollPosition < contactTop + 100
      )
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (isMobileMenuOpen && target && !target.closest('.nav-container')) {
        setIsMobileMenuOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
        }
      })
    }, observerOptions)

    const hiddenElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    hiddenElements.forEach((el) => observer.observe(el))

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  /** iOS/Safari often ignore background-attachment:fixed; mimic desktop parallax on narrow viewports. */
  useEffect(() => {
    const section = philosophySectionRef.current
    const bg = philosophyBgRef.current
    if (!section || !bg) return

    const mobileQuery = '(max-width: 768px)'
    const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0

    const updateParallax = () => {
      if (!window.matchMedia(mobileQuery).matches || reduceMotion()) {
        bg.style.transform = ''
        return
      }
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const centerOffset = rect.top + rect.height / 2 - vh / 2
      const y = centerOffset * -0.22
      bg.style.transform = `translate3d(0, ${y}px, 0)`
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateParallax)
    }

    const mq = window.matchMedia(mobileQuery)
    const onMqChange = () => schedule()

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    mq.addEventListener('change', onMqChange)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      mq.removeEventListener('change', onMqChange)
      bg.style.transform = ''
    }
  }, [])

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {splashActive && (
        <div
          className={`splash-intro ${splashExiting ? 'splash-intro--exit' : ''}`}
          aria-hidden="true"
        >
          <div className="splash-intro__curtain" />
          <div className="splash-intro__grain" aria-hidden="true" />
          <div className="splash-intro__inner">
            <p className="splash-intro__kicker">Elite lifestyle training</p>
            <div className="splash-intro__brand" aria-label={SPLASH_LOGO}>
              {SPLASH_LOGO.split('').map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  className="splash-intro__char"
                  style={{ animationDelay: `${0.06 + i * 0.028}s` }}
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="splash-intro__rule" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#" className="logo" onClick={() => setIsMobileMenuOpen(false)}>
            HxTraining
          </a>
          <button
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          {isMobileMenuOpen && (
            <div
              className="mobile-menu-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}
          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a>
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
            <a href="https://www.instagram.com/hxtraining_/?hl=en" target="_blank" rel="noopener noreferrer" className="instagram-link" onClick={() => setIsMobileMenuOpen(false)}>
              Instagram
            </a>
            <a href="#contact" className="nav-cta-button" onClick={() => setIsMobileMenuOpen(false)}>
              Get Started →
            </a>
          </div>
        </div>
      </nav>

      <main id="main-content">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-eyebrow">Private coaching · Results-driven</p>
          <h1 className="hero-title">
            <span className="line">Transform</span>
            <span className="line">Your Body</span>
            <span className="line">Transform</span>
            <span className="line">Your Life.</span>
          </h1>
          <p className="hero-subtitle">Personalized Coaching & Transformation</p>
          <a href="#contact" className="cta-button">
            <span className="cta-button-inner">Begin Your Journey</span>
          </a>
        </div>
        <div className="hero-overlay" />
        <a href="#about" className="hero-scroll-hint" aria-label="Scroll to about">
          <span className="hero-scroll-line" aria-hidden="true" />
          <span className="hero-scroll-label">Discover</span>
        </a>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="section-container">
          <div className="about-wrapper">
            <div className="about-text reveal-left">
              <h2 className="section-title">About</h2>
              <p className="large-text">
                <span className="inline-logo">HxTraining</span> delivers personalized coaching designed for results. Every program is crafted around your goals,
                lifestyle, and performance standards; with custom workouts, strategic nutrition, and direct coach access. This is high touch
                coaching for those who value precision, accountability, and lasting transformation.
              </p>
            </div>
            <div className="about-image-wrapper reveal-right">
              <img
                src={trainerImage}
                alt="Trainer"
                className="about-image"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="section-container">
          <div className="section-header reveal">
            <h2 className="section-title">Services</h2>
          </div>
          <div className="services-grid">
            <div className="service-card reveal delay-100">
              <h3>Private In-Person Coaching</h3>
              <p>Personalized in-person training sessions tailored to your goals, fitness level, and schedule. Expect hands-on instruction, precise real-time feedback, & focused support in a private training environment.</p>
            </div>
            <div className="service-card reveal delay-200">
              <h3>Online Coaching 1-on-1</h3>
              <p>An elevated coaching experience delivered through a personalized app. Includes custom programming, weekly check-ins, detailed progress tracking, & direct access to your coach for ongoing guidance + accountability.</p>
            </div>
            <div className="service-card reveal delay-300">
              <h3>Custom Meal Plan + Supplement Advice</h3>
              <p>Custom nutrition plans crafted to your dietary preferences, goals, and lifestyle. All programs include a custom meal guide & strategic supplement recommendations to support performance, recovery, and long-term results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section — bg layer: fixed on desktop; scroll-parallax on mobile */}
      <section ref={philosophySectionRef} className="philosophy">
        <div
          ref={philosophyBgRef}
          className="philosophy-bg"
          style={{ backgroundImage: `url(${trainerImage2})` }}
          aria-hidden="true"
        />
        <div className="philosophy-content">
          <div className="philosophy-text reveal-scale">
            <h2>ELITE</h2>
            <h2>LIFESTYLE</h2>
            <h2>TRAINING</h2>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="section-container">
          <div className="contact-content reveal">
            <h2 className="section-title">Get Started</h2>
            <p className="contact-description">
              Ready to begin your transformation? Fill out the form below and let's discuss how we can help you achieve your goals through personalized online coaching.
            </p>

            <ContactApplicationForm />
          </div>
        </div>
      </section>

      {/* Floating Mobile CTA */}
      <a
        href="#contact"
        className={`floating-cta ${showFloatingCta ? '' : 'hidden'}`}
        aria-label="Get Started"
      >
        Start Your Journey →
      </a>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">HxTraining</div>
          <div className="footer-links">
            <a href="https://www.instagram.com/hxtraining_/?hl=en" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
