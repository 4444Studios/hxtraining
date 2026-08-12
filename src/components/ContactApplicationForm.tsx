import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { useIsMobile } from '../hooks/useIsMobile'
import { reverseGeocode } from '../lib/reverseGeocode'
import ContactFormDesktop from './contact/ContactFormDesktop'
import ContactFormWizard from './contact/ContactFormWizard'


export interface FormData {
  firstName: string
  lastName: string
  location: string
  phoneNumber: string
  instagramHandle: string
  fitnessGoal: string
  pastAttempts: string
  medicalConditions: string
  commitment: string
  availableDays: string[]
  daysPerWeek: string
  startDate: string
  services: string[]
  reason: string
}

export interface FormErrors {
  [key: string]: string
}

interface SavedFormPayload {
  formData: FormData
  currentStep?: number
}

const TOTAL_STEPS = 4

const STEP_META = [
  { title: 'About you', helper: 'Tell us who you are' },
  { title: 'Your goals', helper: 'Help us understand your journey' },
  { title: 'Training plan', helper: 'Schedule and commitment' },
  { title: 'Services', helper: 'Almost done' },
] as const

/** Maps validation field keys to wizard step (step 2 has no required fields). */
const FIELD_TO_WIZARD_STEP: Record<string, number> = {
  firstName: 1,
  lastName: 1,
  location: 1,
  phoneNumber: 1,
  commitment: 3,
  availableDays: 3,
  daysPerWeek: 3,
  startDate: 3,
  services: 4,
}

function getFirstInvalidWizardStep(fieldErrors: FormErrors): number | null {
  const steps = Object.keys(fieldErrors)
    .map(key => FIELD_TO_WIZARD_STEP[key])
    .filter((step): step is number => step != null)
  return steps.length > 0 ? Math.min(...steps) : null
}

const EMPTY_FORM: FormData = {
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
  reason: '',
}

function getDefaultStartDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  return nextMonday.toISOString().split('T')[0]
}

function hasFormContent(data: FormData): boolean {
  return Boolean(
    data.firstName ||
      data.lastName ||
      data.phoneNumber ||
      data.location ||
      data.services.length > 0 ||
      data.availableDays.length > 0
  )
}

function parseSavedForm(raw: string): { formData: FormData; currentStep: number } | null {
  try {
    const parsed = JSON.parse(raw) as SavedFormPayload | FormData
    if (parsed && typeof parsed === 'object' && 'formData' in parsed && parsed.formData) {
      return {
        formData: { ...EMPTY_FORM, ...parsed.formData },
        currentStep: Math.min(Math.max(parsed.currentStep ?? 1, 1), TOTAL_STEPS),
      }
    }
    return {
      formData: { ...EMPTY_FORM, ...(parsed as FormData) },
      currentStep: 1,
    }
  } catch {
    return null
  }
}

export default function ContactApplicationForm() {
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationDetecting, setLocationDetecting] = useState(false)
  const [locationHint, setLocationHint] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [wizardOpen, setWizardOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward')
  const panelRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('hxTrainingForm')
    if (saved) {
      const parsed = parseSavedForm(saved)
      if (parsed) {
        setFormData(parsed.formData)
        if (parsed.currentStep > 1) setCurrentStep(parsed.currentStep)
        return
      }
      localStorage.removeItem('hxTrainingForm')
    }
    setFormData(prev => ({ ...prev, startDate: getDefaultStartDate() }))
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasFormContent(formData)) {
        const payload: SavedFormPayload = {
          formData,
          ...(isMobile && wizardOpen ? { currentStep } : {}),
        }
        localStorage.setItem('hxTrainingForm', JSON.stringify(payload))
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [formData, currentStep, isMobile, wizardOpen])

  useLayoutEffect(() => {
    if (!wizardOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [wizardOpen])

  useEffect(() => {
    if (!wizardOpen) return
    const t = window.setTimeout(() => {
      firstFieldRef.current?.focus()
    }, 120)
    return () => window.clearTimeout(t)
  }, [wizardOpen, currentStep])

  useEffect(() => {
    if (!isMobile) return
    const onHashChange = () => {
      if (window.location.hash === '#contact' && !wizardOpen && !submitted) {
        setWizardOpen(true)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [isMobile, wizardOpen, submitted])

  const fillLocationFromCoordinates = useCallback(async (latitude: number, longitude: number) => {
    const line = await reverseGeocode(latitude, longitude)
    setFormData(prev => ({ ...prev, location: line }))
    setLocationHint(null)
  }, [])

  const handleUseMyLocation = useCallback(() => {
    setLocationHint(null)

    if (!window.isSecureContext) {
      setLocationHint(
        'Location detection needs HTTPS (or localhost). Please enter your city manually.'
      )
      return
    }

    if (!navigator.geolocation) {
      setLocationHint('Location is not available in this browser. Please enter your city manually.')
      return
    }

    setLocationDetecting(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        void fillLocationFromCoordinates(latitude, longitude)
          .catch(() => {
            setLocationHint(
              'Could not look up your city from GPS. Please type your location manually.'
            )
          })
          .finally(() => setLocationDetecting(false))
      },
      err => {
        setLocationDetecting(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationHint(
            'Location permission was denied. Enable it in browser settings or enter your city manually.'
          )
        } else if (err.code === err.TIMEOUT) {
          setLocationHint('Location timed out. Please try again or enter your city manually.')
        } else {
          setLocationHint(
            'Location is unavailable. Please enter your city below (works without GPS).'
          )
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  }, [fillLocationFromCoordinates])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value, type } = target
    const checked = target.checked

    if (type === 'checkbox') {
      if (name === 'availableDays' || name === 'services') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
            ? [...prev[name], value]
            : prev[name].filter((item: string) => item !== value),
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }))
    if (errors.availableDays) setErrors(prev => ({ ...prev, availableDays: '' }))
  }

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }))
    if (errors.services) setErrors(prev => ({ ...prev, services: '' }))
  }

  const setCommitment = (value: string) => {
    setFormData(prev => ({ ...prev, commitment: value }))
    if (errors.commitment) setErrors(prev => ({ ...prev, commitment: '' }))
  }

  const setDaysPerWeek = (value: string) => {
    setFormData(prev => ({ ...prev, daysPerWeek: value }))
    if (errors.daysPerWeek) setErrors(prev => ({ ...prev, daysPerWeek: '' }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.location.trim()) newErrors.location = 'Location is required'
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    } else if (step === 3) {
      if (!formData.commitment) newErrors.commitment = 'Please confirm your commitment'
      if (formData.availableDays.length === 0) {
        newErrors.availableDays = 'Please select at least one day'
      }
      if (!formData.daysPerWeek) newErrors.daysPerWeek = 'Please select days per week'
      if (!formData.startDate) newErrors.startDate = 'Please select a start date'
    } else if (step === 4) {
      if (formData.services.length === 0) newErrors.services = 'Please select at least one service'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildFormErrors = (): FormErrors => {
    const newErrors: FormErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required'
    if (!formData.commitment) newErrors.commitment = 'Please confirm your commitment'
    if (formData.availableDays.length === 0) newErrors.availableDays = 'Please select at least one day'
    if (!formData.daysPerWeek) newErrors.daysPerWeek = 'Please select days per week'
    if (!formData.startDate) newErrors.startDate = 'Please select a start date'
    if (formData.services.length === 0) newErrors.services = 'Please select at least one service'
    return newErrors
  }

  const applyValidationErrors = (newErrors: FormErrors): boolean => {
    setErrors(newErrors)
    const valid = Object.keys(newErrors).length === 0
    if (!valid && isMobile && wizardOpen) {
      const invalidStep = getFirstInvalidWizardStep(newErrors)
      if (invalidStep != null && invalidStep !== currentStep) {
        setSlideDirection(invalidStep < currentStep ? 'back' : 'forward')
        setCurrentStep(invalidStep)
      }
      setSubmitError('Please complete all required fields highlighted below.')
    } else if (!valid) {
      setSubmitError('Please complete all required fields.')
    } else {
      setSubmitError(null)
    }
    return valid
  }

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      panelRef.current?.querySelector('.error-message')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, startDate: getDefaultStartDate() })
    setCurrentStep(1)
    setErrors({})
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitError(null)

    if (isMobile && wizardOpen && currentStep === TOTAL_STEPS && !validateStep(4)) {
      scrollToFirstError()
      return
    }

    if (!applyValidationErrors(buildFormErrors())) {
      scrollToFirstError()
      return
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS configuration is missing. Rebuild with .env present (VITE_EMAILJS_*).')
      setSubmitError('Email is not configured on this deployment. Please contact us directly.')
      return
    }

    setIsSubmitting(true)

    try {
      emailjs.init({ publicKey })

      const templateParams = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        location: formData.location,
        instagramPhone: `Phone: ${formData.phoneNumber}${formData.instagramHandle ? ` | IG: ${formData.instagramHandle}` : ''}`,
        fitnessGoal: formData.fitnessGoal || 'Not specified',
        pastAttempts: formData.pastAttempts || 'Not specified',
        medicalConditions: formData.medicalConditions || 'None',
        commitment: formData.commitment === 'yes' ? "Yes, let's do this!" : "NO, I'm not ready.",
        availableDays: formData.availableDays.join(', ') || 'Not specified',
        daysPerWeek: formData.daysPerWeek || 'Not specified',
        startDate: formData.startDate || 'Not specified',
        services: formData.services.join(', ') || 'Not specified',
        reason: formData.reason || 'Not specified',
      }

      const sheetDbUrl = import.meta.env.VITE_SHEETDB_URL
      const sheetData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        location: formData.location,
        instagramPhone: templateParams.instagramPhone,
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

      const emailResult = await emailjs.send(serviceId, templateId, templateParams, { publicKey })

      if (sheetDbUrl) {
        try {
          const sheetRes = await fetch(sheetDbUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sheetData),
          })
          if (!sheetRes.ok) {
            console.warn('SheetDB submission failed; email was sent.', await sheetRes.text())
          }
        } catch (sheetErr) {
          console.warn('SheetDB submission failed; email was sent.', sheetErr)
        }
      }

      if (emailResult.status !== 200) {
        throw new Error(`EmailJS returned status ${emailResult.status}`)
      }

      setSubmitted(true)
      setSubmitError(null)
      setWizardOpen(false)
      localStorage.removeItem('hxTrainingForm')

      window.setTimeout(() => {
        resetForm()
        setSubmitted(false)
      }, 3000)
    } catch (error: unknown) {
      console.error('Form submission error:', error)
      const detail =
        error && typeof error === 'object' && 'text' in error
          ? String((error as { text?: string }).text)
          : error instanceof Error
            ? error.message
            : 'Unknown error'
      setSubmitError(
        `Could not send your application (${detail}). Please try again or contact us directly.`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWizardNext = () => {
    setSubmitError(null)
    if (!validateStep(currentStep)) {
      scrollToFirstError()
      return
    }
    if (currentStep < TOTAL_STEPS) {
      setSlideDirection('forward')
      setCurrentStep(s => s + 1)
    }
  }

  const handleWizardBack = () => {
    setSubmitError(null)
    if (currentStep > 1) {
      setSlideDirection('back')
      setCurrentStep(s => s - 1)
    }
  }

  const closeWizard = useCallback(() => {
    if (hasFormContent(formData)) {
      const ok = window.confirm('Discard your application progress?')
      if (!ok) return
    }
    setWizardOpen(false)
    setCurrentStep(1)
    setErrors({})
  }, [formData])

  useEffect(() => {
    if (!wizardOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWizard()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [wizardOpen, closeWizard])

  const openWizard = () => {
    setSlideDirection('forward')
    setWizardOpen(true)
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  if (submitted) {
    return (
      <div className="form-success">
        <h3>Thank you for your interest!</h3>
        <p>We&apos;ll be in touch soon.</p>
      </div>
    )
  }

  const sharedProps = {
    formData,
    errors,
    locationDetecting,
    locationHint,
    isSubmitting,
    onChange: handleInputChange,
    onLocationDetect: handleUseMyLocation,
    onClearLocationHint: () => setLocationHint(null),
    onSubmit: handleSubmit,
  }

  return (
    <>
      {isMobile ? (
        <div className="contact-form-mobile-entry">
          <p className="contact-form-mobile-entry__text">
            Apply in a few quick steps — takes about 3 minutes.
          </p>
          <button type="button" className="contact-form-mobile-entry__cta" onClick={openWizard}>
            Start application
          </button>
        </div>
      ) : (
        <ContactFormDesktop {...sharedProps} />
      )}
      {wizardOpen && isMobile && (
        <ContactFormWizard
          formData={formData}
          errors={errors}
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepMeta={STEP_META[currentStep - 1]}
          progressPercent={progressPercent}
          slideDirection={slideDirection}
          locationDetecting={locationDetecting}
          locationHint={locationHint}
          isSubmitting={isSubmitting}
          panelRef={panelRef}
          firstFieldRef={firstFieldRef}
          onChange={handleInputChange}
          onLocationDetect={handleUseMyLocation}
          onClearLocationHint={() => setLocationHint(null)}
          onClose={closeWizard}
          onBack={handleWizardBack}
          onNext={handleWizardNext}
          onSubmit={() => void handleSubmit()}
          onToggleDay={toggleDay}
          onToggleService={toggleService}
          onSetCommitment={setCommitment}
          onSetDaysPerWeek={setDaysPerWeek}
          submitError={submitError}
        />
      )}
    </>
  )
}