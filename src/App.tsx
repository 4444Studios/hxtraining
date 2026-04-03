import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import './App.css'

const LoginPage = lazy(() => import('./components/admin/LoginPage'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./components/admin/DashboardPage'))
const AvailabilityPage = lazy(() => import('./components/admin/AvailabilityPage'))
const ClientsPage = lazy(() => import('./components/admin/ClientsPage'))

function AdminRouteFallback() {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.05em',
        fontSize: '0.9rem',
      }}
    >
      Loading…
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AdminRouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="clients" element={<ClientsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
