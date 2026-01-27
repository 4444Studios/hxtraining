import { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'
import trainerImage from './assets/Trainer.png'
import './App.css'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    location: '',
    instagramPhone: '',
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
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
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
    if (!formData.instagramPhone.trim()) newErrors.instagramPhone = 'Instagram @ & Phone Number is required'
    if (!formData.commitment) newErrors.commitment = 'Please confirm your commitment'
    if (formData.availableDays.length === 0) newErrors.availableDays = 'Please select at least one day'
    if (!formData.daysPerWeek) newErrors.daysPerWeek = 'Please select days per week'
    if (!formData.startDate) newErrors.startDate = 'Please select a start date'

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
        instagramPhone: formData.instagramPhone,
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
        instagramPhone: formData.instagramPhone,
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

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          location: '',
          instagramPhone: '',
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
        setTimeout(() => {
          setFormData({
            firstName: '',
            lastName: '',
            location: '',
            instagramPhone: '',
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
          <p className="hero-subtitle">Virtual Coaching & Transformation</p>
          <a href="#contact" className="cta-button">Begin Your Journey</a>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="section-container">
          <div className="about-wrapper">
            <div className="about-content">
              <h2 className="section-title">About</h2>
              <div className="about-text">
                <p className="large-text">
                  HxTraining is more than fitness—it's a philosophy. We believe in pushing boundaries,
                  breaking limits, and discovering the strength within, all from the comfort of your own space.
                </p>
                <p>
                  HX Training delivers personalized coaching designs for results. Every program is crafted around your goals,
                  lifestyle, and performance standards; with custom workouts, strategic nutrition, and direct coach access. This is high touch
                  coaching for those who value precision, accountability, and lasting transformation.
                </p>
              </div>
            </div>
            <div className="about-image-wrapper">
              <img src={trainerImage} alt="Trainer" className="about-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Services</h2>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <h3>Private In-Person Coaching</h3>
              <p>Personalized in-person training sessions tailored to your goals, fitness level, and schedule. Expect hands-on instruction, precise real-time feedback, & focused support in a private training environment.</p>
            </div>
            <div className="service-card">
              <h3>Online Coaching 1-on-1</h3>
              <p>An elevated coaching experience delivered through a personalized app. Includes custom programming, weekly check-ins, detailed progress tracking, & direct access to your coach for ongoing guidance + accountability.</p>
            </div>
            <div className="service-card">
              <h3>Custom Meal Plan + Supplement Advice</h3>
              <p>Custom nutrition plans crafted to your dietary preferences, goals, and lifestyle. All programs include a custom meal guide & strategic supplement recommendations to support performance, recovery, and long-term results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="philosophy">
        <div className="philosophy-content">
          <div className="philosophy-text">
            <h2>ELITE</h2>
            <h2>LIFESTYLE</h2>
            <h2>TRAINING</h2>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="section-container">
          <div className="contact-content">
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

                {/* Instagram & Phone */}
                <div className="form-group">
                  <label htmlFor="instagramPhone">
                    What is your Instagram @ & Phone Number? <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="instagramPhone"
                    name="instagramPhone"
                    placeholder="@username & Phone Number"
                    value={formData.instagramPhone}
                    onChange={handleInputChange}
                    className={errors.instagramPhone ? 'error' : ''}
                  />
                  {errors.instagramPhone && <span className="error-message">{errors.instagramPhone}</span>}
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
                  <label>Which of my services are you inquiring about?</label>
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

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">HxTraining</div>
          <div className="footer-links">
            <a href="https://www.instagram.com/hxtraining_/?hl=en" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span>© 2024</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
