import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { loanApi } from '../api/axios'

const statusConfig = {
  SUBMITTED:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Soumis' },
  UNDER_REVIEW: { bg: '#fffbeb', color: '#d97706', label: 'En révision' },
  APPROVED:     { bg: '#f0fdf4', color: '#16a34a', label: 'Approuvé' },
  REJECTED:     { bg: '#fef2f2', color: '#dc2626', label: 'Rejeté' },
  ACTIVE:       { bg: '#f0fdf4', color: '#15803d', label: 'Actif' },
  CLOSED:       { bg: '#f8fafc', color: '#64748b', label: 'Clôturé' },
}

function calcMonthly(amount, rate, months) {
  if (!amount || !months || amount <= 0) return 0
  const r = rate / 100 / 12
  if (r === 0) return amount / months
  return amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

export default function Loans() {
  const { user } = useAuth()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', duration_months: 12, interest_rate: 8, purpose: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchLoans = async () => {
    try {
      const res = await loanApi.get(`/loans/customer/${user?.userId}`)
      setLoans(res.data || [])
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLoans() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.userId) { setError('Session expirée'); return }
    setSubmitting(true); setError('')
    try {
      await loanApi.post('/loans', {
        customer_id: user.userId,
        amount: parseFloat(form.amount),
        duration_months: parseInt(form.duration_months),
        interest_rate: parseFloat(form.interest_rate),
        purpose: form.purpose
      })
      setSuccess('Demande de prêt soumise avec succès !')
      setShowForm(false)
      fetchLoans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la demande')
    } finally { setSubmitting(false) }
  }

  const monthly = calcMonthly(parseFloat(form.amount), parseFloat(form.interest_rate), parseInt(form.duration_months))
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length
  const totalBorrowed = loans.reduce((s, l) => s + (l.amount || 0), 0)

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
        <div style={{
          borderLeft: '4px solid #6366f1',
          paddingLeft: '1rem',
        }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            Mes Prêts
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{loans.length} demande(s) de prêt</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: showForm ? '#ef4444' : 'linear-gradient(135deg,#f59e0b,#d97706)',
          color: 'white', border: 'none', borderRadius: '10px', padding: '0.7rem 1.4rem',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
        }}>
          {showForm ? '✕ Annuler' : '+ Demander un prêt'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Prêts actifs',    value: activeLoans,                             color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Total emprunté',  value: `${totalBorrowed.toLocaleString()} XOF`, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Demandes',        value: loans.length,                             color: '#f59e0b', bg: '#fffbeb' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: s.bg, flexShrink: 0 }} />
            <div>
              <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{s.label}</p>
              <p style={{ color: s.color, fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>
          {success}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Nouvelle demande de prêt</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {[
                { label: 'Montant (XOF)', name: 'amount',  type: 'number', placeholder: '500000' },
                { label: 'Objet du prêt', name: 'purpose', type: 'text',   placeholder: 'Achat véhicule...' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    placeholder={f.placeholder} required={f.name === 'amount'}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Durée</label>
                <select value={form.duration_months} onChange={e => setForm({ ...form, duration_months: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}>
                  {[6,12,18,24,36,48,60].map(m => <option key={m} value={m}>{m} mois</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taux annuel (%)</label>
                <input type="number" step="0.1" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {form.amount > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
                <div>
                  <p style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mensualité estimée</p>
                  <p style={{ color: '#d97706', fontSize: '1.4rem', fontWeight: 700 }}>{monthly.toFixed(0).toLocaleString()} XOF</p>
                </div>
                <div>
                  <p style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coût total</p>
                  <p style={{ color: '#d97706', fontSize: '1.4rem', fontWeight: 700 }}>{(monthly * form.duration_months).toFixed(0).toLocaleString()} XOF</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              padding: '0.8rem 2rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              {submitting ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </form>
        </div>
      )}

      {/* Liste prêts */}
      {loans.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '4rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Aucun prêt</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Faites votre première demande de prêt</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loans.map(loan => {
            const sc = statusConfig[loan.status] || statusConfig.SUBMITTED
            const progress = loan.status === 'ACTIVE' && loan.repayments
              ? (loan.repayments.filter(r => r.status === 'PAID').length / loan.repayments.length) * 100
              : 0
            return (
              <div key={loan.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>{loan.purpose || 'Prêt personnel'}</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
                      {loan.amount?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>XOF</span>
                    </p>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, fontSize: '0.8rem', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>
                    {sc.label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: loan.status === 'ACTIVE' ? '1rem' : 0 }}>
                  {[
                    { label: 'Taux',      value: `${loan.interest_rate}%` },
                    { label: 'Durée',     value: `${loan.duration_months} mois` },
                    { label: 'Mensualité', value: loan.monthly_payment ? `${loan.monthly_payment?.toFixed(0).toLocaleString()} XOF` : '-' },
                    { label: 'Score crédit', value: loan.credit_score, color: loan.credit_score >= 650 ? '#16a34a' : '#d97706' },
                  ].map((d, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{d.label}</p>
                      <p style={{ color: d.color || '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {loan.status === 'ACTIVE' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Progression remboursement</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6366f1' }}>{progress.toFixed(0)}%</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
