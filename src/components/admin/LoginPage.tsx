import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../App.css'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('http://localhost:3005/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await response.json()
            if (response.ok) {
                localStorage.setItem('adminToken', data.token)
                navigate('/admin/dashboard')
            } else {
                setError(data.error || 'Login failed')
            }
        } catch (err) {
            setError('Network error')
        }
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#000',
            color: '#fff'
        }}>
            <form onSubmit={handleLogin} style={{
                padding: '2rem',
                border: '1px solid #333',
                borderRadius: '8px',
                width: '300px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <h2 style={{ textAlign: 'center', margin: 0 }}>Admin Login</h2>
                {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', color: '#fff' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', color: '#fff' }}
                    />
                </div>

                <button type="submit" className="submit-button" style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}>
                    Login
                </button>
            </form>
        </div>
    )
}

export default LoginPage
