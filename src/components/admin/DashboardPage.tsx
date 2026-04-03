import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Session {
    id: number;
    trainer: { name: string };
    client: { name: string; email: string };
    service: string;
    date: string;
    durationMinutes: number;
    status: string;
}

function DashboardPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .select('*, client:clients(name, email), trainer:trainers(name)')

                if (error) throw error
                if (data) {
                    setSessions(data as any)
                }
            } catch (error) {
                console.error('Error fetching sessions', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSessions()
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#888', marginBottom: '1rem' }}>Upcoming Appointments</h2>
                {sessions.length === 0 ? (
                    <p style={{ color: '#666' }}>No appointments found.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {sessions.map(session => (
                            <div key={session.id} style={{
                                background: '#1a1a1a',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                border: '1px solid #333'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>{new Date(session.date).toLocaleString()}</span>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        background: '#333',
                                        fontSize: '0.8rem',
                                        textTransform: 'capitalize'
                                    }}>
                                        {session.status}
                                    </span>
                                </div>
                                <div style={{ color: '#ccc' }}>Client: {session.client?.name || 'Guest'}</div>
                                <div style={{ color: '#ccc' }}>Service: {session.service}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DashboardPage
