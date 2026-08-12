import {
  DAYS_PER_WEEK,
  SERVICES,
  WEEKDAYS,
  type FormData,
  type FormErrors,
} from './formConfig'

interface Props {
  formData: FormData
  errors: FormErrors
  locationDetecting: boolean
  locationHint: string | null
  isSubmitting: boolean
  submitError: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onLocationDetect: () => void
  onClearLocationHint: () => void
  onSubmit: (e: React.FormEvent) => void
}

export default function ContactFormDesktop({
  formData,
  errors,
  locationDetecting,
  locationHint,
  isSubmitting,
  submitError,
  onChange,
  onLocationDetect,
  onClearLocationHint,
  onSubmit,
}: Props) {
  return (
    <form className="contact-form" onSubmit={onSubmit}>
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
              onChange={onChange}
              className={errors.firstName ? 'error' : ''}
            />
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={onChange}
              className={errors.lastName ? 'error' : ''}
            />
          </div>
          {(errors.firstName || errors.lastName) && (
            <span className="error-message">Name is required</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location">
          Where are you located? <span className="required">*</span>
        </label>
        <span className="sub-label">
          Enter your city or use your device location (optional — requires permission on iPhone).
        </span>
        <input
          type="text"
          id="location"
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
            onChange={onChange}
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
            onChange={onChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="fitnessGoal">What is your overall fitness goal?</label>
        <textarea
          id="fitnessGoal"
          name="fitnessGoal"
          placeholder="Tell us about your fitness goals..."
          value={formData.fitnessGoal}
          onChange={onChange}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pastAttempts">What have you tried in the past that didn&apos;t work for you?</label>
        <textarea
          id="pastAttempts"
          name="pastAttempts"
          placeholder="Share your past experiences..."
          value={formData.pastAttempts}
          onChange={onChange}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="medicalConditions">Do you have any medical conditions or injuries?</label>
        <textarea
          id="medicalConditions"
          name="medicalConditions"
          placeholder="Please share any relevant medical information..."
          value={formData.medicalConditions}
          onChange={onChange}
          rows={3}
        />
      </div>

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
              onChange={onChange}
            />
            <span>Yes let&apos;s do this!</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="commitment"
              value="no"
              checked={formData.commitment === 'no'}
              onChange={onChange}
            />
            <span>NO, I&apos;m not ready.</span>
          </label>
        </div>
        {errors.commitment && <span className="error-message">{errors.commitment}</span>}
      </div>

      <div className="form-group">
        <label>
          What days of the week are you available to train? <span className="required">*</span>
          <span className="sub-label">Select all that apply.</span>
        </label>
        <div className="checkbox-group">
          {WEEKDAYS.map(day => (
            <label key={day} className="checkbox-label">
              <input
                type="checkbox"
                name="availableDays"
                value={day}
                checked={formData.availableDays.includes(day)}
                onChange={onChange}
              />
              <span>{day}</span>
            </label>
          ))}
        </div>
        {errors.availableDays && <span className="error-message">{errors.availableDays}</span>}
      </div>

      <div className="form-group">
        <label>
          How many days of the week are you looking to train? <span className="required">*</span>
        </label>
        <div className="radio-group">
          {DAYS_PER_WEEK.map(num => (
            <label key={num} className="radio-label">
              <input
                type="radio"
                name="daysPerWeek"
                value={num}
                checked={formData.daysPerWeek === String(num)}
                onChange={onChange}
              />
              <span>{num}</span>
            </label>
          ))}
        </div>
        {errors.daysPerWeek && <span className="error-message">{errors.daysPerWeek}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="startDate">
          When would you like to start training? <span className="required">*</span>
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={onChange}
          className={errors.startDate ? 'error' : ''}
        />
        {errors.startDate && <span className="error-message">{errors.startDate}</span>}
      </div>

      <div className="form-group">
        <label>
          Which of my services are you inquiring about? <span className="required">*</span>
        </label>
        <div className="checkbox-group">
          {SERVICES.map(service => (
            <label key={service} className="checkbox-label">
              <input
                type="checkbox"
                name="services"
                value={service}
                checked={formData.services.includes(service)}
                onChange={onChange}
              />
              <span>{service}</span>
            </label>
          ))}
        </div>
        {errors.services && <span className="error-message">{errors.services}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="reason">What made you reach out to me, to be your health and fitness coach?</label>
        <textarea
          id="reason"
          name="reason"
          placeholder="Tell us what inspired you to reach out..."
          value={formData.reason}
          onChange={onChange}
          rows={4}
        />
      </div>

      {submitError && (
        <p className="form-submit-error" role="alert">
          {submitError}
        </p>
      )}

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Submit Application'}
      </button>
    </form>
  )
}
