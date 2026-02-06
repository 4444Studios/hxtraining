import { useEffect } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import '../../App.css'

function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const token = localStorage.getItem('adminToken')
        if (!token) {
            navigate('/admin/login')
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
    }

    const isActive = (path: string) => location.pathname === path

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
            {/* Sidebar */}
            <aside style={{
                width: '250px',
                borderRight: '1px solid #333',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '3rem' }}>HxAdmin</div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                    <Link
                        to="/admin/dashboard"
                        style={{
                            color: isActive('/admin/dashboard') ? '#fff' : '#888',
                            textDecoration: 'none',
                            fontWeight: isActive('/admin/dashboard') ? 'bold' : 'normal'
                        }}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/availability"
                        style={{
                            color: isActive('/admin/availability') ? '#fff' : '#888',
                            textDecoration: 'none',
                            fontWeight: isActive('/admin/availability') ? 'bold' : 'normal'
                        }}
                    >
                        Availability
                    </Link>
                    <Link
                        to="/admin/clients"
                        style={{
                            color: isActive('/admin/clients') ? '#fff' : '#888',
                            textDecoration: 'none',
                            fontWeight: isActive('/admin/clients') ? 'bold' : 'normal'
                        }}
                    >
                        Clients
                    </Link>
                    <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>View Site</Link>
                </nav>

                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: 'auto',
                        background: 'none',
                        border: 'none',
                        color: '#FF4444',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0
                    }}
                >
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
