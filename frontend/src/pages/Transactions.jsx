import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { transactionApi, accountApi } from '../api/axios'

const statusConfig = {
  COMPLETED: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e', label: 'Complété' },
  PENDING:   { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b', label: 'En attente' },
  FAILED:    { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Échoué' },
  CANCELLED: { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8', label: 'Annulé' },
}

const typeIcons = {
  DEPOT: '⬇️', RETRAIT: '⬆️', TRANSFERT_INTRA: '↔️', TRANSFERT_INTER: '🌐',
  REMBOURSEMENT_PRET: '💰', DECAISSEMENT_PRET: '📤'
}

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'DEPOT', sourceAccountId: '', destinationAccountId: '', amount: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accRes = await accountApi.get(`/accounts/customer/${user?.userId}`)
        const accs = accRes.data || []
        setAccounts(accs)
        if (accs.length > 0) {
          const txRes = await transactionApi.get(`/transactions/account/${accs[0].id}`).catch(() => ({ data: [] }))
          setTransactions(txRes.data || [])
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const payload = { type: form.type, amount: parseFloat(form.amount), description: form.description, currency: 'XOF' }
      if (form.type === 'DEPOT') payload.destinationAccountId = form.destinationAccountId
      else if (form.type === 'RETRAIT') payload.sourceAccountId = form.sourceAccountId
      else { payload.sourceAccountId = form.sourceAccountId; payload.destinationAccountId = form.destinationAccountId }

      await transactionApi.post('/transactions', payload)
      setSuccess('Transaction effectuée avec succès !')
      setShowForm(false)
      setForm({ type: 'DEPOT', sourceAccountId: '', destinationAccountId: '', amount: '', description: '' })
      setTimeout(() => setSuccess(''), 3000)

      if (accounts.length > 0) {
        const txRes = await transactionApi.get(`/transactions/account/${accounts[0].id}`).catch(() => ({ data: [] }))
        setTransactions(txRes.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la transaction')
    } finally { setSubmitting(false) }
  }

  const totalIn = transactions.filter(t => t.type === 'DEPOT' && t.status === 'COMPLETED').reduce((s, t) => s + (t.amount || 0), 0)
  const totalOut = transactions.filter(t => t.type === 'RETRAIT' && t.status === 'COMPLETED').reduce((s, t) => s + (t.amount || 0), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Transactions</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{transactions.length} transaction(s) enregistrée(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: showForm ? '#ef4444' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: 'white', border: 'none', borderRadius: '10px', padding: '0.7rem 1.4rem',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
        }}>
          {showForm ? '✕ Annuler' : '+ Nouvelle transaction'}
        </button>
      </div>

      {/* Stats mini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total entrants', value: `+${totalIn.toLocaleString()} XOF`, color: '#16a34a', bg: '#f0fdf4', icon: '⬇️' },
          { label: 'Total sortants', value: `-${totalOut.toLocaleString()} XOF`, color: '#dc2626', bg: '#fef2f2', icon: '⬆️' },
          { label: 'Transactions', value: transactions.length, color: '#6366f1', bg: '#eef2ff', icon: '↔️' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{s.label}</p>
              <p style={{ color: s.color, fontWeight: 700, fontSize: '1rem' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>✅ {success}</div>}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Nouvelle transaction</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}>
                <option value="DEPOT">⬇️ Dépôt</option>
                <option value="RETRAIT">⬆️ Retrait</option>
                <option value="TRANSFERT_INTRA">↔️ Transfert</option>
              </select>
            </div>
            {(form.type === 'RETRAIT' || form.type === 'TRANSFERT_INTRA') && (
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compte source</label>
                <select value={form.sourceAccountId} onChange={e => setForm({ ...form, sourceAccountId: e.target.value })} required
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}>
                  <option value="">Sélectionner...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.balance?.toLocaleString()} {a.currency}</option>)}
                </select>
              </div>
            )}
            {(form.type === 'DEPOT' || form.type === 'TRANSFERT_INTRA') && (
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compte destinataire</label>
                <select value={form.destinationAccountId} onChange={e => setForm({ ...form, destinationAccountId: e.target.value })} required
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}>
                  <option value="">Sélectionner...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.balance?.toLocaleString()} {a.currency}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Montant (XOF)</label>
              <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Motif..."
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={submitting} style={{
              padding: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              {submitting ? 'Traitement...' : 'Confirmer'}
            </button>
          </form>
        </div>
      )}

      {/* Liste transactions */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Historique</h3>
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
            <p>Aucune transaction</p>
          </div>
        ) : (
          <div>
            {transactions.map((tx, i) => {
              const sc = statusConfig[tx.status] || statusConfig.PENDING
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: i < transactions.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginRight: '1rem', flexShrink: 0 }}>
                    {typeIcons[tx.type] || '💳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', marginBottom: '2px' }}>{tx.description || tx.type}</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace' }}>{tx.reference}</p>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: tx.type === 'DEPOT' ? '#16a34a' : '#dc2626' }}>
                      {tx.type === 'DEPOT' ? '+' : '-'}{tx.amount?.toLocaleString()} {tx.currency}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      {tx.initiatedAt ? new Date(tx.initiatedAt).toLocaleDateString('fr-FR') : ''}
                    </p>
                  </div>
                  <div style={{ background: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                    {sc.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
