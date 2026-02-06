import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './components/admin/LoginPage'
import AdminLayout from './components/admin/AdminLayout'
import DashboardPage from './components/admin/DashboardPage'
import AvailabilityPage from './components/admin/AvailabilityPage'
import ClientsPage from './components/admin/ClientsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} /> {/* Redirects to dashboard if only /admin is hit, usually handled by checking subpath or redirection */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="clients" element={<ClientsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
