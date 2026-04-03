import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Client {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
}

function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const { data, error } = await supabase.from('clients').select('*')
                if (error) throw error
                if (data) setClients(data as Client[])
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
                                    <td style={{ padding: '1rem' }}>{client.phone_number || '-'}</td>
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
