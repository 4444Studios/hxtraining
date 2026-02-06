import { useState, useEffect } from 'react'

interface Availability {
    [day: string]: string[];
}

interface Trainer {
    id: number;
    name: string;
    availability: Availability | null;
}

function AvailabilityPage() {
    const [trainer, setTrainer] = useState<Trainer | null>(null)
    const [availability, setAvailability] = useState<Availability>({})
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    // Hardcoded trainer ID for now, or fetch the logged-in trainer's ID
    const TRAINER_ID = 1

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    useEffect(() => {
        const fetchTrainer = async () => {
            try {
                const token = localStorage.getItem('adminToken')
                const response = await fetch(`http://localhost:3005/api/trainers/${TRAINER_ID}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (response.ok) {
                    const data = await response.json()
                    setTrainer(data)
                    setAvailability(data.availability || {})
                }
            } catch (error) {
                console.error('Error fetching trainer', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrainer()
    }, [])

    const handleTimeChange = (day: string, index: number, value: string) => {
        const updatedDay = [...(availability[day] || ['', ''])]
        updatedDay[index] = value
        setAvailability({
            ...availability,
            [day]: updatedDay
        })
    }

    const handleSave = async () => {
        try {
            setMessage('Saving...')
            const token = localStorage.getItem('adminToken')
            const response = await fetch(`http://localhost:3005/api/trainers/${TRAINER_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ availability })
            })

            if (response.ok) {
                setMessage('Saved successfully!')
                setTimeout(() => setMessage(''), 3000)
            } else {
                setMessage('Failed to save.')
            }
        } catch (error) {
            console.error('Error saving availability', error)
            setMessage('Error saving.')
        }
    }

    if (loading) return <div>Loading...</div>
    if (!trainer) return <div>Trainer not found.</div>

    return (
        <div>
            <h1>Manage Availability</h1>
            <p style={{ color: '#888', marginBottom: '2rem' }}>Set your working hours for each day. (Format: HH:MM, 24h)</p>

            <div style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
                {DAYS.map(day => (
                    <div key={day} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        background: '#1a1a1a',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #333'
                    }}>
                        <div style={{ width: '100px', fontWeight: 'bold' }}>{day}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="time"
                                value={availability[day]?.[0] || ''}
                                onChange={(e) => handleTimeChange(day, 0, e.target.value)}
                                style={{ padding: '0.5rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
                            />
                            <span>to</span>
                            <input
                                type="time"
                                value={availability[day]?.[1] || ''}
                                onChange={(e) => handleTimeChange(day, 1, e.target.value)}
                                style={{ padding: '0.5rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button
                    onClick={handleSave}
                    className="cta-button" // Reuse existing class if available, or style inline
                    style={{ cursor: 'pointer', padding: '10px 20px' }}
                >
                    Save Changes
                </button>
                {message && <span style={{ marginLeft: '1rem', color: message.includes('Failed') || message.includes('Error') ? 'red' : 'green' }}>{message}</span>}
            </div>
        </div>
    )
}

export default AvailabilityPage
