import { createPortal } from 'react-dom'
import {
  DAYS_PER_WEEK,
  SERVICES,
  WEEKDAYS,
  type FormData,
  type FormErrors,
} from './formConfig'

function dayAbbrev(day: string): string {
  return day.slice(0, 3)
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface StepMeta {
  title: string
  helper: string
}

export interface ContactFormWizardProps {
  formData: FormData
  errors: FormErrors
  currentStep: number
  totalSteps: number
  stepMeta: StepMeta
  progressPercent: number
  slideDirection: 'forward' | 'back'
  locationDetecting: boolean
  locationHint: string | null
  isSubmitting: boolean
  panelRef: React.RefObject<HTMLDivElement | null>
  firstFieldRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onLocationDetect: () => void
  onClearLocationHint: () => void
  onClose: () => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  onToggleDay: (day: string) => void
  onToggleService: (service: string) => void
  onSetCommitment: (value: string) => void
  onSetDaysPerWeek: (value: string) => void
  submitError: string | null
}

export default function ContactFormWizard(props: ContactFormWizardProps) {
  const {
    formData,
    errors,
    currentStep,
    totalSteps,
    stepMeta,
    progressPercent,
    slideDirection,
    locationDetecting,
    locationHint,
    isSubmitting,
    panelRef,
    firstFieldRef,
    onChange,
    onLocationDetect,
    onClearLocationHint,
    onClose,
    onBack,
    onNext,
    onSubmit,
    onToggleDay,
    onToggleService,
    onSetCommitment,
    onSetDaysPerWeek,
    submitError,
  } = props

  const panelClass = `form-wizard__panel form-wizard__panel--${slideDirection}`
  const isLastStep = currentStep === totalSteps

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="form-group">
              <label htmlFor="wizard-firstName">First name <span className="required">*</span></label>
              <input
                ref={firstFieldRef as React.RefObject<HTMLInputElement>}
                type="text"
                id="wizard-firstName"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={onChange}
                className={errors.firstName ? 'error' : ''}
                autoComplete="given-name"
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="wizard-lastName">Last name <span className="required">*</span></label>
              <input
                type="text"
                id="wizard-lastName"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={onChange}
                className={errors.lastName ? 'error' : ''}
                autoComplete="family-name"
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="wizard-location">Where are you located? <span className="required">*</span></label>
              <input
                type="text"
                id="wizard-location"
                name="location"
                placeholder="City, State or Country"
                value={formData.location}
                onChange={e => {
                  onClearLocationHint()
                  onChange(e)
                }}
                className={errors.location ? 'error' : ''}
                autoComplete="address-level2"
              />
              <button
                type="button"
                className="location-detect-button"
                onClick={onLocationDetect}
                disabled={locationDetecting}
              >
                {locationDetecting ? 'Detecting…' : 'Use my current location'}
              </button>
              {locationHint && <span className="sub-label location-hint">{locationHint}</span>}
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="wizard-phone">Phone <span className="required">*</span></label>
              <input
                type="tel"
                id="wizard-phone"
                name="phoneNumber"
                placeholder="(555) 555-5555"
                value={formData.phoneNumber}
                onChange={onChange}
                className={errors.phoneNumber ? 'error' : ''}
                autoComplete="tel"
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="wizard-instagram">Instagram <span className="required">*</span></label>
              <input
                type="text"
                id="wizard-instagram"
                name="instagramHandle"
                placeholder="@username"
                value={formData.instagramHandle}
                onChange={onChange}
                className={errors.instagramHandle ? 'error' : ''}
              />
              {errors.instagramHandle && <span className="error-message">{errors.instagramHandle}</span>}
            </div>
          </>
        )
      case 2:
        return (
          <>
            <div className="form-group">
              <label htmlFor="wizard-fitnessGoal">What is your overall fitness goal?</label>
              <textarea
                id="wizard-fitnessGoal"
                name="fitnessGoal"
                placeholder="Tell us about your goals…"
                value={formData.fitnessGoal}
                onChange={onChange}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="wizard-pastAttempts">What have you tried that didn&apos;t work?</label>
              <textarea
                id="wizard-pastAttempts"
                name="pastAttempts"
                placeholder="Share past experiences…"
                value={formData.pastAttempts}
                onChange={onChange}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="wizard-medical">Medical conditions or injuries?</label>
              <textarea
                id="wizard-medical"
                name="medicalConditions"
                placeholder="Share anything relevant…"
                value={formData.medicalConditions}
                onChange={onChange}
                rows={3}
              />
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div className="form-group">
              <p className="form-wizard__question">
                60-day minimum commitment to reach your goals. Ready?
                <span className="required"> *</span>
              </p>

              <div className="choice-cards">
                <button
                  type="button"
                  className={`choice-card${formData.commitment === 'yes' ? ' choice-card--selected' : ''}`}
                  onClick={() => onSetCommitment('yes')}
                >
                  Yes, let&apos;s do this!
                </button>
                <button
                  type="button"
                  className={`choice-card${formData.commitment === 'no' ? ' choice-card--selected' : ''}`}
                  onClick={() => onSetCommitment('no')}
                >
                  Not ready yet
                </button>
              </div>
              {errors.commitment && <span className="error-message">{errors.commitment}</span>}
            </div>
            <div className="form-group">
              <p className="form-wizard__question">
                Available training days <span className="required">*</span>
              </p>
              <div className="day-chips">
                {WEEKDAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`day-chip${formData.availableDays.includes(day) ? ' day-chip--selected' : ''}`}
                    onClick={() => onToggleDay(day)}
                    aria-pressed={formData.availableDays.includes(day)}
                  >
                    {dayAbbrev(day)}
                  </button>
                ))}
              </div>
              {errors.availableDays && <span className="error-message">{errors.availableDays}</span>}
            </div>
            <div className="form-group">
              <p className="form-wizard__question">Days per week <span className="required">*</span></p>
              <div className="segmented-control">
                {DAYS_PER_WEEK.map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`segmented-control__btn${formData.daysPerWeek === String(num) ? ' segmented-control__btn--selected' : ''}`}
                    onClick={() => onSetDaysPerWeek(String(num))}
                    aria-pressed={formData.daysPerWeek === String(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {errors.daysPerWeek && <span className="error-message">{errors.daysPerWeek}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="wizard-startDate">Start date <span className="required">*</span></label>
              <input
                type="date"
                id="wizard-startDate"
                name="startDate"
                value={formData.startDate}
                onChange={onChange}
                className={errors.startDate ? 'error' : ''}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>
          </>
        )
      case 4:
        return (
          <>
            <div className="form-group">
              <p className="form-wizard__question">
                Which services interest you? <span className="required">*</span>
              </p>
              <div className="service-chips">
                {SERVICES.map(service => (
                  <button
                    key={service}
                    type="button"
                    className={`service-chip${formData.services.includes(service) ? ' service-chip--selected' : ''}`}
                    onClick={() => onToggleService(service)}
                    aria-pressed={formData.services.includes(service)}
                  >
                    {service}
                  </button>
                ))}
              </div>
              {errors.services && <span className="error-message">{errors.services}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="wizard-reason">What made you reach out?</label>
              <textarea
                id="wizard-reason"
                name="reason"
                placeholder="Tell us what inspired you…"
                value={formData.reason}
                onChange={onChange}
                rows={4}
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  const wizard = (
    <div
      className="form-wizard"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-wizard-title"
    >
      <header className="form-wizard__header">
        <button
          type="button"
          className="form-wizard__close"
          onClick={onClose}
          aria-label="Close application"
        >
          <IconClose />
        </button>
        <div className="form-wizard__progress-wrap">
          <div className="form-wizard__progress-track" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
            <div
              className="form-wizard__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <p className="form-wizard__step-label">
          Step {currentStep} of {totalSteps} · {stepMeta.title}
        </p>
        <h2 id="form-wizard-title" className="form-wizard__title">
          {stepMeta.title}
        </h2>
        <p className="form-wizard__helper">{stepMeta.helper}</p>
      </header>

      <div className="form-wizard__body">
        <div ref={panelRef} className={panelClass} key={currentStep}>
          {renderStep()}
        </div>
      </div>

      <footer className="form-wizard__footer">
        {submitError && (
          <p className="form-wizard__submit-error" role="alert">
            {submitError}
          </p>
        )}
        {currentStep > 1 ? (
          <button
            type="button"
            className="form-wizard__btn form-wizard__btn--back"
            onClick={onBack}
            aria-label="Previous step"
          >
            <IconChevronLeft />
            Back
          </button>
        ) : (
          <span />
        )}
        {isLastStep ? (
          <button
            type="button"
            className="form-wizard__btn form-wizard__btn--primary"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending…' : 'Submit application'}
          </button>
        ) : (
          <button
            type="button"
            className="form-wizard__btn form-wizard__btn--primary"
            onClick={onNext}
          >
            Next
          </button>
        )}
      </footer>
    </div>
  )

  return createPortal(wizard, document.body)
}
