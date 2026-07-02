import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { accountApi, customerApi } from '../api/axios'

const typeColors = {
  COURANT:      { bg: '#eef2ff', color: '#6366f1', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
  EPARGNE:      { bg: '#f0fdf4', color: '#22c55e', grad: 'linear-gradient(135deg,#16a34a,#15803d)' },
  MOBILE_MONEY: { bg: '#ecfeff', color: '#06b6d4', grad: 'linear-gradient(135deg,#0891b2,#0e7490)' },
}

export default function Accounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'COURANT', currency: 'XOF', initialDeposit: 0 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAccounts = async () => {
    try {
      const isAdmin = ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'OPERATOR_ANALYST'].includes(user?.role)

      if (isAdmin) {
        // Admin : récupérer TOUS les comptes directement
        const res = await accountApi.get('/accounts').catch(() => ({ data: [] }))
        setAccounts(res.data || [])
      } else {
        // Client : récupérer ses propres comptes via userId
        // D'abord trouver son customerId
        const customerRes = await customerApi.get(`/customers/by-user/${user?.userId}`).catch(() => null)
        const customerId = customerRes?.data?.id || user?.userId
        const res = await accountApi.get(`/accounts/customer/${customerId}`)
        setAccounts(res.data || [])
      }
    } catch { setError('Impossible de charger les comptes') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAccounts() }, [])

  const handleOpenAccount = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      await accountApi.post('/accounts', { ...form, customerId: user?.userId })
      setSuccess('Compte ouvert avec succès !')
      setShowForm(false)
      fetchAccounts()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ouverture")
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b' }}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{['SUPER_ADMIN', 'OPERATOR_ADMIN', 'OPERATOR_ANALYST'].includes(user?.role) ? 'Tous les Comptes' : 'Mes Comptes'}</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{accounts.length} compte(s) {['SUPER_ADMIN', 'OPERATOR_ADMIN', 'OPERATOR_ANALYST'].includes(user?.role) ? 'sur la plateforme' : 'enregistré(s)'}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: showForm ? '#ef4444' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: 'white', border: 'none', borderRadius: '10px', padding: '0.7rem 1.4rem',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
        }}>
          {showForm ? '✕ Annuler' : '+ Nouveau compte'}
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>✅ {success}</div>}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Ouvrir un nouveau compte</h3>
          <form onSubmit={handleOpenAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}>
                <option value="COURANT">Compte Courant</option>
                <option value="EPARGNE">Compte Épargne</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Devise</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}>
                <option value="XOF">XOF — Franc CFA</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dépôt initial</label>
              <input type="number" min="0" value={form.initialDeposit}
                onChange={e => setForm({ ...form, initialDeposit: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={submitting} style={{
              padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
            }}>
              {submitting ? 'Ouverture...' : 'Ouvrir le compte'}
            </button>
          </form>
        </div>
      )}

      {/* Cartes de comptes */}
      {accounts.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '4rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Aucun compte</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Ouvrez votre premier compte bancaire</p>
          <button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
            + Ouvrir un compte
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {accounts.map(acc => {
            const style = typeColors[acc.type] || typeColors.COURANT
            return (
              <div key={acc.id} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                {/* Partie haute — carte */}
                <div style={{ background: style.grad, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ position: 'absolute', bottom: -20, left: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {acc.type.replace('_', ' ')}
                    </span>
                    <span style={{ background: acc.status === 'ACTIVE' ? 'rgba(134,239,172,0.2)' : 'rgba(252,165,165,0.2)', color: acc.status === 'ACTIVE' ? '#86efac' : '#fca5a5', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                      {acc.status}
                    </span>
                  </div>
                  <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {acc.balance?.toLocaleString()}
                    <span style={{ fontSize: '0.9rem', opacity: 0.7, marginLeft: '6px' }}>{acc.currency}</span>
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    {acc.accountNumber}
                  </p>
                </div>
                {/* Partie basse — détails */}
                <div style={{ background: 'white', padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {['SUPER_ADMIN', 'OPERATOR_ADMIN', 'OPERATOR_ANALYST'].includes(user?.role) && acc.customerId && (
                    <div style={{ gridColumn: '1 / -1', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.25rem' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Client (ID)</p>
                      <p style={{ color: '#6366f1', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>{acc.customerId}</p>
                    </div>
                  )}
                  {[
                    { label: 'Limite / jour', value: `${acc.dailyLimit?.toLocaleString()} ${acc.currency}` },
                    { label: 'Limite / mois', value: `${acc.monthlyLimit?.toLocaleString()} ${acc.currency}` },
                  ].map((d, i) => (
                    <div key={i}>
                      <p style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{d.label}</p>
                      <p style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
