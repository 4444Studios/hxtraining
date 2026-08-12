# HxTraining - Virtual Coaching Website

A modern, minimalist website for HxTraining virtual coaching services, built with React and Vite.

## Features

- AllSaints-inspired dark, minimalist design
- Comprehensive client intake form
- EmailJS integration for form submissions
- Fully responsive design
- Smooth animations and transitions

## Setup

### Installation

```bash
npm install
```

### EmailJS Configuration

This project uses EmailJS to handle form submissions. To set it up:

1. **Sign up for EmailJS**: Go to [https://www.emailjs.com/](https://www.emailjs.com/) and create a free account

2. **Create an Email Service**:
   - Go to Email Services and add a new service (Gmail, Outlook, etc.)
   - Follow the setup instructions for your email provider
   - Note your Service ID

3. **Create an Email Template**:
   - Go to Email Templates and create a new template
   - Use these template variables in your email template:
     - `{{fullName}}` - Client's full name
     - `{{firstName}}` - First name
     - `{{lastName}}` - Last name
     - `{{location}}` - Location
     - `{{instagramPhone}}` - Instagram handle and phone
     - `{{fitnessGoal}}` - Fitness goals
     - `{{pastAttempts}}` - Past attempts
     - `{{medicalConditions}}` - Medical conditions
     - `{{commitment}}` - 60-day commitment response
     - `{{availableDays}}` - Available training days
     - `{{daysPerWeek}}` - Days per week to train
     - `{{startDate}}` - Preferred start date
     - `{{services}}` - Services interested in
     - `{{reason}}` - Reason for reaching out
   - Note your Template ID

4. **Get your Public Key**:
   - Go to Account > API Keys
   - Copy your Public Key

5. **Create Environment File**:
   - Copy `.env.example` to `.env`
   - Fill in your EmailJS credentials:
     ```
     VITE_EMAILJS_SERVICE_ID=your_service_id
     VITE_EMAILJS_TEMPLATE_ID=your_template_id
     VITE_EMAILJS_PUBLIC_KEY=your_public_key
     ```

6. **Configure Email Recipient**:
   - In your EmailJS template settings, set the "To Email" field to your email address
   - This is where all form submissions will be sent

### SheetDB Configuration (Google Sheets Integration)

This project uses SheetDB to automatically save form submissions to a Google Sheet.

1. **Create a Google Sheet**:
   - Create a new Google Sheet with the following column headers (in the first row):
     - `firstName`, `lastName`, `location`, `instagramPhone`, `fitnessGoal`, `pastAttempts`, `medicalConditions`, `commitment`, `availableDays`, `daysPerWeek`, `startDate`, `services`, `reason`, `timestamp`
   - Make sure the sheet is publicly accessible (or set up proper permissions)

2. **Set up SheetDB**:
   - Go to [https://sheetdb.io/](https://sheetdb.io/)
   - Sign up for a free account
   - Click "Create API" and connect your Google Sheet
   - Copy the API URL (it will look like: `https://sheetdb.io/api/v1/YOUR_SHEET_ID`)

3. **Add SheetDB URL to Environment**:
   - Add to your `.env` file:
     ```
     VITE_SHEETDB_URL=https://sheetdb.io/api/v1/YOUR_SHEET_ID
     ```
   - Note: SheetDB URL is optional. If not provided, form will still work with EmailJS only

4. **Test the Integration**:
   - Submit a test form
   - Check your Google Sheet to verify the data was added
   - Check your email for the notification

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Deploying to GitHub Pages

Production deploys from **committed source on `main`** via GitHub Actions (not from a local dirty tree). The workflow builds with Vite, then publishes `dist/` to the `gh-pages` branch for `hxtrainingclub.com`.

**Normal deploy:**

1. Commit your source changes
2. Push to `main`:
   ```bash
   git push origin main
   ```
3. GitHub Actions runs **Deploy to GitHub Pages** and updates the live site

**Required repo secrets** (Settings → Secrets and variables → Actions):

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_SHEETDB_URL` (optional)

Booking/admin (Supabase) is maintained on the `Database` branch, not on `main`.

**Pages settings** (repo: **4444Studios/hxtraining**):

- Source: `gh-pages` branch
- Custom domain: `hxtrainingclub.com`
- Enforce HTTPS

**Emergency local deploy only** (requires a clean git working tree):

```bash
pnpm run deploy:local
```

**Note:** The `base` path in `vite.config.ts` is set to `/` for custom domain usage.

## Environment Variables

All sensitive keys are stored in `.env` which is gitignored. Never commit your `.env` file to version control.

The `.env.example` file serves as a template for required environment variables.

## Security Notes

- EmailJS Public Key is safe to expose in client-side code (it's designed for this)
- Service ID and Template ID are also safe to expose
- The `.env` file is automatically ignored by git
- Always use environment variables for configuration
