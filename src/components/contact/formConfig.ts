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

export const TOTAL_STEPS = 4

export const STEP_META = [
  { title: 'About you', helper: 'Tell us who you are' },
  { title: 'Your goals', helper: 'Help us understand your journey' },
  { title: 'Training plan', helper: 'Schedule and commitment' },
  { title: 'Services', helper: 'Almost done' },
] as const

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const SERVICES = ['1 on 1', 'Group Training', 'Online Coaching'] as const

export const DAYS_PER_WEEK = [2, 3, 4, 5] as const

/** Maps validation field keys to wizard step (step 2 has no required fields). */
const FIELD_TO_WIZARD_STEP: Record<string, number> = {
  firstName: 1,
  lastName: 1,
  location: 1,
  phoneNumber: 1,
  instagramHandle: 1,
  commitment: 3,
  availableDays: 3,
  daysPerWeek: 3,
  startDate: 3,
  services: 4,
}

export const EMPTY_FORM: FormData = {
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

export function getDefaultStartDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  return nextMonday.toISOString().split('T')[0]
}

export function hasFormContent(data: FormData): boolean {
  return Boolean(
    data.firstName ||
      data.lastName ||
      data.phoneNumber ||
      data.location ||
      data.services.length > 0 ||
      data.availableDays.length > 0
  )
}

export function getFirstInvalidWizardStep(fieldErrors: FormErrors): number | null {
  const steps = Object.keys(fieldErrors)
    .map(key => FIELD_TO_WIZARD_STEP[key])
    .filter((step): step is number => step != null)
  return steps.length > 0 ? Math.min(...steps) : null
}

function errorsForStep1(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.firstName.trim()) errors.firstName = 'First name is required'
  if (!data.lastName.trim()) errors.lastName = 'Last name is required'
  if (!data.location.trim()) errors.location = 'Location is required'
  if (!data.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required'
  if (!data.instagramHandle.trim()) errors.instagramHandle = 'Instagram handle is required'
  return errors
}

function errorsForStep3(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.commitment) errors.commitment = 'Please confirm your commitment'
  if (data.availableDays.length === 0) {
    errors.availableDays = 'Please select at least one day'
  }
  if (!data.daysPerWeek) errors.daysPerWeek = 'Please select days per week'
  if (!data.startDate) errors.startDate = 'Please select a start date'
  return errors
}

function errorsForStep4(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (data.services.length === 0) errors.services = 'Please select at least one service'
  return errors
}

/** Validate a single wizard step. */
export function buildStepErrors(data: FormData, step: number): FormErrors {
  if (step === 1) return errorsForStep1(data)
  if (step === 3) return errorsForStep3(data)
  if (step === 4) return errorsForStep4(data)
  return {}
}

/** Full-form validation used on submit. */
export function buildFormErrors(data: FormData): FormErrors {
  return {
    ...errorsForStep1(data),
    ...errorsForStep3(data),
    ...errorsForStep4(data),
  }
}
