import { useState, useEffect } from 'react'

interface Client {
    id: number;
    name: string;
    email: string;
    phoneNumber?: string;
}

function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem('adminToken')
                const response = await fetch('http://localhost:3005/api/clients', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (response.ok) {
                    const data = await response.json()
                    setClients(data)
                }
            } catch (error) {
                console.error('Error fetching clients', error)
            } finally {
                setLoading(false)
            }
        }

        fetchClients()
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div>
            <h1>Clients</h1>
            <div style={{ marginTop: '2rem' }}>
                {clients.length === 0 ? (
                    <p>No clients found.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Phone</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '1rem' }}>{client.name}</td>
                                    <td style={{ padding: '1rem' }}>{client.email}</td>
                                    <td style={{ padding: '1rem' }}>{client.phoneNumber || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <a
                                            href={`mailto:${client.email}`}
                                            style={{
                                                color: '#000',
                                                background: '#fff',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                textDecoration: 'none',
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            Message
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default ClientsPage
