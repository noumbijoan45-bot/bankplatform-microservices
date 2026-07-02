import { useState, useEffect } from 'react'
import { customerApi as api } from '../api/axios'

const statusConfig = {
  ACTIVE:       { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  VERIFIED:     { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  PENDING:      { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  UNDER_REVIEW: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  SUSPENDED:    { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  REJECTED:     { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data || [])
    } catch { setError('Impossible de charger les clients') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleVerify = async (id) => {
    try {
      await api.post(`/customers/${id}/verify`)
      setSuccess('Client vérifié ✅')
      fetchCustomers()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Erreur lors de la vérification') }
  }

  const handleSuspend = async (id) => {
    if (!confirm('Suspendre ce client ?')) return
    try {
      await api.post(`/customers/${id}/suspend`)
      setSuccess('Client suspendu')
      fetchCustomers()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Erreur lors de la suspension') }
  }

  const filtered = customers.filter(c => {
    const matchSearch = `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => ['ACTIVE', 'VERIFIED'].includes(c.status)).length,
    pending: customers.filter(c => c.status === 'PENDING').length,
    suspended: customers.filter(c => c.status === 'SUSPENDED').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Gestion des Clients</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Gérez et vérifiez les comptes clients</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: stats.total, icon: '👥', color: '#6366f1', bg: '#eef2ff' },
          { label: 'Actifs', value: stats.active, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'En attente', value: stats.pending, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
          { label: 'Suspendus', value: stats.suspended, icon: '🚫', color: '#dc2626', bg: '#fef2f2' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{s.label}</p>
              <p style={{ color: s.color, fontWeight: 700, fontSize: '1.3rem' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>✅ {success}</div>}

      {/* Filtres */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..."
          style={{ flex: 1, minWidth: '200px', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              background: filterStatus === s ? '#6366f1' : '#f1f5f9',
              color: filterStatus === s ? 'white' : '#64748b',
            }}>
              {s === 'ALL' ? 'Tous' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{filtered.length} client(s)</h3>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <p>Aucun client trouvé</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Client', 'Email', 'Téléphone', 'Score', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const sc = statusConfig[c.status] || statusConfig.PENDING
                  return (
                    <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{c.firstName} {c.lastName}</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{c.country || '—'}</p>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>{c.email}</td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>{c.phoneNumber || '—'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 700, color: c.creditScore >= 650 ? '#16a34a' : '#d97706', fontSize: '0.9rem' }}>
                          {c.creditScore || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {c.status === 'PENDING' && (
                            <button onClick={() => handleVerify(c.id)} style={{ padding: '0.35rem 0.8rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                              ✓ Vérifier
                            </button>
                          )}
                          {c.status !== 'SUSPENDED' && (
                            <button onClick={() => handleSuspend(c.id)} style={{ padding: '0.35rem 0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                              Suspendre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
