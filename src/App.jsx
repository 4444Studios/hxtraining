import { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'
import trainerImage from './assets/Trainer.png'
import './App.css'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFloatingCta, setShowFloatingCta] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    location: '',
    location: '',
    phoneNumber: '',
    instagramHandle: '',
    fitnessGoal: '',
    pastAttempts: '',
    medicalConditions: '',
    commitment: '',
    availableDays: [],
    daysPerWeek: '',
    startDate: '',
    services: [],
    reason: ''
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    // Check localStorage first
    const savedData = localStorage.getItem('hxTrainingForm')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(parsed)
      } catch (e) {
        console.error('Error parsing saved form data', e)
        localStorage.removeItem('hxTrainingForm')
      }
    } else {
      // Set default start date to next Monday if no saved date
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilMonday = (8 - dayOfWeek) % 7 || 7 // Ensure it's next week if today is Monday
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + daysUntilMonday)

      const formattedDate = nextMonday.toISOString().split('T')[0]

      setFormData(prev => ({
        ...prev,
        startDate: formattedDate
      }))
    }
  }, [])

  // Auto-save form data to localStorage
  useEffect(() => {
    // Debounce saving to avoid too many writes
    const timeoutId = setTimeout(() => {
      // Don't save if empty (initial state) or if currently submitting
      if (formData.firstName || formData.lastName || formData.phoneNumber || formData.services.length > 0) {
        localStorage.setItem('hxTrainingForm', JSON.stringify(formData))
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData])

  useEffect(() => {
    // Autofill location based on IP
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        if (data.city && data.region) {
          setFormData(prev => ({
            ...prev,
            location: `${data.city}, ${data.region}`
          }))
        }
      } catch (error) {
        console.log('Could not autofill location', error)
      }
    }

    if (!formData.location) {
      fetchLocation()
    }

    // Close mobile menu when clicking outside
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.nav-container')) {
        setIsMobileMenuOpen(false)
      }
    }

    // Close mobile menu on escape key
    const handleEscape = (e) => {
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



  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox') {
      if (name === 'availableDays' || name === 'services') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }))
      }
    } else if (name === 'phoneNumber') {
      // Auto-format phone numbers
      let val = value

      // Strip all non-numeric chars except + and space
      if (/^[\d+\s()-]*$/.test(val)) {
        // Simple US format logic if needed, or just allow common chars
        // For now just allow what they type but maybe strip invalid chars if needed
        // Keeping it simple: allow user input, but validation will check length/content if needed
      }

      setFormData(prev => ({ ...prev, [name]: val }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required'
    if (!formData.commitment) newErrors.commitment = 'Please confirm your commitment'
    if (formData.availableDays.length === 0) newErrors.availableDays = 'Please select at least one day'
    if (!formData.daysPerWeek) newErrors.daysPerWeek = 'Please select days per week'
    if (!formData.startDate) newErrors.startDate = 'Please select a start date'
    if (formData.services.length === 0) newErrors.services = 'Please select at least one service'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Check if EmailJS environment variables are set
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS configuration is missing. Please check your .env file.')
      alert('Email service is not configured. Please contact the administrator.')
      return
    }

    setIsSubmitting(true)

    try {
      // Initialize EmailJS with public key
      emailjs.init(publicKey)

      // Prepare template parameters for EmailJS
      const templateParams = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        location: formData.location,
        // Combine phone and insta for the existing email template field
        instagramPhone: `Phone: ${formData.phoneNumber}${formData.instagramHandle ? ` | IG: ${formData.instagramHandle}` : ''}`,
        fitnessGoal: formData.fitnessGoal || 'Not specified',
        pastAttempts: formData.pastAttempts || 'Not specified',
        medicalConditions: formData.medicalConditions || 'None',
        commitment: formData.commitment === 'yes' ? 'Yes, let\'s do this!' : 'NO, I\'m not ready.',
        availableDays: formData.availableDays.join(', ') || 'Not specified',
        daysPerWeek: formData.daysPerWeek || 'Not specified',
        startDate: formData.startDate || 'Not specified',
        services: formData.services.join(', ') || 'Not specified',
        reason: formData.reason || 'Not specified',
      }

      // Prepare data for SheetDB (Google Sheet)
      const sheetDbUrl = import.meta.env.VITE_SHEETDB_URL
      const sheetData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        location: formData.location,
        instagramPhone: `Phone: ${formData.phoneNumber}${formData.instagramHandle ? ` | IG: ${formData.instagramHandle}` : ''}`,
        fitnessGoal: formData.fitnessGoal || '',
        pastAttempts: formData.pastAttempts || '',
        medicalConditions: formData.medicalConditions || '',
        commitment: formData.commitment === 'yes' ? 'Yes' : 'No',
        availableDays: formData.availableDays.join(', ') || '',
        daysPerWeek: formData.daysPerWeek || '',
        startDate: formData.startDate || '',
        services: formData.services.join(', ') || '',
        reason: formData.reason || '',
        timestamp: new Date().toISOString(),
      }

      // Send email via EmailJS and save to Google Sheet via SheetDB in parallel
      const promises = [
        emailjs.send(serviceId, templateId, templateParams)
      ]

      // Add SheetDB request if URL is configured
      if (sheetDbUrl) {
        promises.push(
          fetch(sheetDbUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData),
          }).then(response => {
            if (!response.ok) {
              throw new Error('SheetDB request failed')
            }
            return response.json()
          })
        )
      }

      // Wait for both requests to complete
      await Promise.all(promises)

      setSubmitted(true)
      localStorage.removeItem('hxTrainingForm') // Clear saved data on success

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          location: '',
          phoneNumber: '',
          instagramHandle: '',
          fitnessGoal: '',
          pastAttempts: '',
          medicalConditions: '',
          commitment: '',
          availableDays: [],
          daysPerWeek: '',
          startDate: '',
          services: [],
          reason: ''
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Form submission error:', error)
      // Still show success if EmailJS worked, even if SheetDB failed
      if (error.message && error.message.includes('SheetDB')) {
        console.warn('SheetDB submission failed, but email was sent successfully')
        setSubmitted(true)
        localStorage.removeItem('hxTrainingForm') // Clear saved data on success
        setTimeout(() => {
          setFormData({
            firstName: '',
            lastName: '',
            location: '',
            phoneNumber: '',
            instagramHandle: '',
            fitnessGoal: '',
            pastAttempts: '',
            medicalConditions: '',
            commitment: '',
            availableDays: [],
            daysPerWeek: '',
            startDate: '',
            services: [],
            reason: ''
          })
          setSubmitted(false)
        }, 3000)
      } else {
        alert('Failed to send your message. Please try again or contact us directly.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">HxTraining</div>
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

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="line">Transform</span>
            <span className="line">Your Body</span>
            <span className="line">Transform Your Life</span>
          </h1>
          <p className="hero-subtitle">Personalized Coaching & Transformation</p>
          <a href="#contact" className="cta-button">Begin Your Journey</a>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="section-container">
          <div className="about-wrapper">
            <div className="about-text reveal-left">
              <h2 className="section-title">About</h2>
              <p className="large-text">
                HX Training delivers personalized coaching designed for results. Every program is crafted around your goals,
                lifestyle, and performance standards; with custom workouts, strategic nutrition, and direct coach access. This is high touch
                coaching for those who value precision, accountability, and lasting transformation.
              </p>
            </div>
            <div className="about-image-wrapper reveal-right">
              <img src={trainerImage} alt="Trainer" className="about-image" />
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

      {/* Philosophy Section */}
      <section className="philosophy">
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

            {submitted ? (
              <div className="form-success">
                <h3>Thank you for your interest!</h3>
                <p>We'll be in touch soon.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                {/* Name Fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      What is your first and last name? <span className="required">*</span>
                    </label>
                    <div className="name-row">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={errors.firstName ? 'error' : ''}
                      />
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={errors.lastName ? 'error' : ''}
                      />
                    </div>
                    {(errors.firstName || errors.lastName) && (
                      <span className="error-message">Name is required</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="form-group">
                  <label htmlFor="location">
                    Where are you located? <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="City, State or Country"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={errors.location ? 'error' : ''}
                  />
                  {errors.location && <span className="error-message">{errors.location}</span>}
                </div>

                {/* Phone Number & Instagram */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phoneNumber">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="(555) 555-5555"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={errors.phoneNumber ? 'error' : ''}
                    />
                    {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="instagramHandle">
                      Instagram Handle <span className="optional">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="instagramHandle"
                      name="instagramHandle"
                      placeholder="@username"
                      value={formData.instagramHandle}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Fitness Goal */}
                <div className="form-group">
                  <label htmlFor="fitnessGoal">What is your overall fitness goal?</label>
                  <textarea
                    id="fitnessGoal"
                    name="fitnessGoal"
                    placeholder="Tell us about your fitness goals..."
                    value={formData.fitnessGoal}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                {/* Past Attempts */}
                <div className="form-group">
                  <label htmlFor="pastAttempts">What have you tried in the past that didn't work for you?</label>
                  <textarea
                    id="pastAttempts"
                    name="pastAttempts"
                    placeholder="Share your past experiences..."
                    value={formData.pastAttempts}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                {/* Medical Conditions */}
                <div className="form-group">
                  <label htmlFor="medicalConditions">Do you have any medical conditions or injuries?</label>
                  <textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    placeholder="Please share any relevant medical information..."
                    value={formData.medicalConditions}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                {/* Commitment */}
                <div className="form-group">
                  <label>
                    Are you aware that by joining my team there is a minimum 60 day commitment, so I can help you reach your goals? <span className="required">*</span>
                  </label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="commitment"
                        value="yes"
                        checked={formData.commitment === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes let's do this!</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="commitment"
                        value="no"
                        checked={formData.commitment === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>NO, I'm not ready.</span>
                    </label>
                  </div>
                  {errors.commitment && <span className="error-message">{errors.commitment}</span>}
                </div>

                {/* Available Days */}
                <div className="form-group">
                  <label>
                    What days of the week are you available to train? <span className="required">*</span>
                    <span className="sub-label">Select all that apply.</span>
                  </label>
                  <div className="checkbox-group">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="availableDays"
                          value={day}
                          checked={formData.availableDays.includes(day)}
                          onChange={handleInputChange}
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                  {errors.availableDays && <span className="error-message">{errors.availableDays}</span>}
                </div>

                {/* Days Per Week */}
                <div className="form-group">
                  <label>
                    How many days of the week are you looking to train? <span className="required">*</span>
                  </label>
                  <div className="radio-group">
                    {[2, 3, 4, 5].map(num => (
                      <label key={num} className="radio-label">
                        <input
                          type="radio"
                          name="daysPerWeek"
                          value={num}
                          checked={formData.daysPerWeek === String(num)}
                          onChange={handleInputChange}
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  {errors.daysPerWeek && <span className="error-message">{errors.daysPerWeek}</span>}
                </div>

                {/* Start Date */}
                <div className="form-group">
                  <label htmlFor="startDate">
                    When would you like to start training? <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={errors.startDate ? 'error' : ''}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                </div>

                {/* Services */}
                <div className="form-group">
                  <label>
                    Which of my services are you inquiring about? <span className="required">*</span>
                  </label>
                  <div className="checkbox-group">
                    {['1 on 1', 'Group Training', 'Online Coaching'].map(service => (
                      <label key={service} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="services"
                          value={service}
                          checked={formData.services.includes(service)}
                          onChange={handleInputChange}
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                  {errors.services && <span className="error-message">{errors.services}</span>}
                </div>

                {/* Reason */}
                <div className="form-group">
                  <label htmlFor="reason">What made you reach out to me, to be your health and fitness coach?</label>
                  <textarea
                    id="reason"
                    name="reason"
                    placeholder="Tell us what inspired you to reach out..."
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Submit Application'}
                </button>
              </form>
            )}
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

export default App
