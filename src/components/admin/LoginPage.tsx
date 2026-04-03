import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../../App.css'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: username,
                password: password,
            })
            if (signInError) throw signInError
            if (data.session) {
                navigate('/admin/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Login failed')
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
