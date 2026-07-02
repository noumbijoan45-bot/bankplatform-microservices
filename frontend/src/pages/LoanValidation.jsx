import { useState, useEffect } from 'react'
import { loanApi } from '../api/axios'

const statusConfig = {
  SUBMITTED:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Soumis', icon: '📤' },
  UNDER_REVIEW: { bg: '#fffbeb', color: '#d97706', label: 'En révision', icon: '🔍' },
  APPROVED:     { bg: '#f0fdf4', color: '#16a34a', label: 'Approuvé', icon: '✅' },
  REJECTED:     { bg: '#fef2f2', color: '#dc2626', label: 'Rejeté', icon: '❌' },
  ACTIVE:       { bg: '#f0fdf4', color: '#15803d', label: 'Actif', icon: '🟢' },
  CLOSED:       { bg: '#f8fafc', color: '#64748b', label: 'Clôturé', icon: '🔒' },
}

export default function LoanValidation() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('SUBMITTED')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [approveForm, setApproveForm] = useState({ interest_rate: 8.0, account_id: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchLoans = async () => {
    try {
      const res = await loanApi.get('/loans')
      setLoans(res.data || [])
    } catch { setError('Impossible de charger les demandes') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLoans() }, [])

  const handleApprove = async (loanId) => {
    setSubmitting(true); setError('')
    try {
      await loanApi.put(`/loans/${loanId}/approve`, {
        interest_rate: approveForm.interest_rate,
        account_id: approveForm.account_id || null
      })
      setSuccess('Prêt approuvé avec succès ✅')
      setSelectedLoan(null)
      fetchLoans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'approbation')
    } finally { setSubmitting(false) }
  }

  const handleReject = async (loanId) => {
    if (!rejectReason.trim()) { setError('Le motif de rejet est obligatoire'); return }
    setSubmitting(true); setError('')
    try {
      await loanApi.put(`/loans/${loanId}/reject`, { reason: rejectReason })
      setSuccess('Prêt rejeté')
      setSelectedLoan(null)
      setRejectReason('')
      fetchLoans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du rejet')
    } finally { setSubmitting(false) }
  }

  const filtered = loans.filter(l => filter === 'ALL' || l.status === filter)

  const stats = {
    total: loans.length,
    submitted: loans.filter(l => l.status === 'SUBMITTED').length,
    underReview: loans.filter(l => l.status === 'UNDER_REVIEW').length,
    approved: loans.filter(l => ['APPROVED', 'ACTIVE'].includes(l.status)).length,
    rejected: loans.filter(l => l.status === 'REJECTED').length,
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

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            Validation des Prêts
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Analysez et validez les demandes de prêts des clients
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: stats.total, color: '#6366f1', bg: '#eef2ff', icon: '📋' },
          { label: 'En attente', value: stats.submitted, color: '#1d4ed8', bg: '#eff6ff', icon: '📤' },
          { label: 'En révision', value: stats.underReview, color: '#d97706', bg: '#fffbeb', icon: '🔍' },
          { label: 'Approuvés', value: stats.approved, color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
          { label: 'Rejetés', value: stats.rejected, color: '#dc2626', bg: '#fef2f2', icon: '❌' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{s.label}</p>
              <p style={{ color: s.color, fontWeight: 700, fontSize: '1.3rem' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>✅ {success}</div>}

      {/* Filtres */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600,
            background: filter === s ? '#6366f1' : '#f1f5f9',
            color: filter === s ? 'white' : '#64748b',
          }}>
            {s === 'ALL' ? 'Tous' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Liste des prêts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '4rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
            <p style={{ color: '#64748b' }}>Aucune demande dans cette catégorie</p>
          </div>
        ) : (
          filtered.map(loan => {
            const sc = statusConfig[loan.status] || statusConfig.SUBMITTED
            const isActionable = ['SUBMITTED', 'UNDER_REVIEW'].includes(loan.status)
            return (
              <div key={loan.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: selectedLoan?.id === loan.id ? '2px solid #6366f1' : '2px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
                        {loan.amount?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>XOF</span>
                      </p>
                      <span style={{ background: sc.bg, color: sc.color, fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {loan.purpose || 'Prêt personnel'} • {loan.duration_months} mois • {loan.interest_rate}%
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px', fontFamily: 'monospace' }}>
                      Client : {loan.customer_id}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: loan.credit_score >= 650 ? '#f0fdf4' : '#fffbeb', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>Score crédit</p>
                      <p style={{ fontWeight: 700, color: loan.credit_score >= 650 ? '#16a34a' : '#d97706', fontSize: '1.2rem' }}>
                        {loan.credit_score}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: isActionable ? '1rem' : 0 }}>
                  {[
                    { label: 'Mensualité estimée', value: loan.monthly_payment ? `${loan.monthly_payment?.toFixed(0)} XOF` : 'Non calculée' },
                    { label: 'Coût total', value: loan.total_amount ? `${loan.total_amount?.toFixed(0)} XOF` : '-' },
                    { label: 'Taux', value: `${loan.interest_rate}%` },
                    { label: 'Soumis le', value: loan.requested_at ? new Date(loan.requested_at).toLocaleDateString('fr-FR') : '-' },
                  ].map((d, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.6rem' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>{d.label}</p>
                      <p style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Boutons d'action */}
                {isActionable && (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={() => setSelectedLoan(selectedLoan?.id === loan.id ? null : loan)}
                      style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      {selectedLoan?.id === loan.id ? 'Fermer' : '⚡ Traiter ce dossier'}
                    </button>
                  </div>
                )}

                {/* Formulaire d'action */}
                {selectedLoan?.id === loan.id && (
                  <div style={{ marginTop: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>
                      Décision pour ce dossier
                    </h4>

                    {/* Approbation */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>✅ Approuver</p>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
                        <div>
                          <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Taux annuel (%)</label>
                          <input type="number" step="0.1" value={approveForm.interest_rate}
                            onChange={e => setApproveForm({ ...approveForm, interest_rate: parseFloat(e.target.value) })}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '120px', outline: 'none' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', textTransform: 'uppercase' }}>ID Compte à créditer (optionnel)</label>
                          <input type="text" placeholder="UUID du compte" value={approveForm.account_id}
                            onChange={e => setApproveForm({ ...approveForm, account_id: e.target.value })}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <button onClick={() => handleApprove(loan.id)} disabled={submitting}
                          style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {submitting ? 'Traitement...' : '✅ Confirmer l\'approbation'}
                        </button>
                      </div>
                    </div>

                    {/* Rejet */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                      <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>❌ Rejeter</p>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Motif du rejet</label>
                          <input type="text" placeholder="Ex: Revenus insuffisants, dossier incomplet..." value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #fecaca', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <button onClick={() => handleReject(loan.id)} disabled={submitting}
                          style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {submitting ? 'Traitement...' : '❌ Confirmer le rejet'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
