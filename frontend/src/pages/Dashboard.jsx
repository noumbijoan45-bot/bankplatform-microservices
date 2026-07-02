import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { accountApi, loanApi, transactionApi } from '../api/axios'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loans, setLoans] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, loanRes] = await Promise.allSettled([
          accountApi.get(`/accounts/customer/${user?.userId}`),
          loanApi.get(`/loans/customer/${user?.userId}`)
        ])
        const accs = accRes.status === 'fulfilled' ? accRes.value.data : []
        setAccounts(accs)
        if (loanRes.status === 'fulfilled') setLoans(loanRes.value.data)

        if (accs.length > 0) {
          const txRes = await transactionApi.get(`/transactions/account/${accs[0].id}`).catch(() => ({ data: [] }))
          setTransactions(txRes.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length
  const completedTx = transactions.filter(t => t.status === 'COMPLETED').length

  // Données graphique évolution solde (simulation)
  const balanceData = [
    { mois: 'Jan', solde: totalBalance * 0.6 },
    { mois: 'Fév', solde: totalBalance * 0.7 },
    { mois: 'Mar', solde: totalBalance * 0.65 },
    { mois: 'Avr', solde: totalBalance * 0.8 },
    { mois: 'Mai', solde: totalBalance * 0.9 },
    { mois: 'Jun', solde: totalBalance },
  ]

  // Données graphique transactions
  const txData = [
    { name: 'Lun', transactions: 4 },
    { name: 'Mar', transactions: 7 },
    { name: 'Mer', transactions: 3 },
    { name: 'Jeu', transactions: 8 },
    { name: 'Ven', transactions: 12 },
    { name: 'Sam', transactions: 5 },
    { name: 'Dim', transactions: 2 },
  ]

  // Données graphique comptes
  const accountData = accounts.map(a => ({
    name: a.type,
    value: a.balance || 0
  }))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b' }}>Chargement du tableau de bord...</p>
    </div>
  )

  return (
    <div style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 400, color: '#0f172a', marginBottom: '0.25rem' }}>
            Bienvenue sur CorBank,{' '}
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>
              {user?.firstName}
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Voici un aperçu de votre activité financière
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Solde total', value: `${totalBalance.toLocaleString()} XOF`, icon: '💰', color: '#6366f1', bg: '#eef2ff', change: '+12.5%' },
          { label: 'Comptes actifs', value: accounts.length, icon: '💳', color: '#22c55e', bg: '#f0fdf4', change: `${accounts.length} compte(s)` },
          { label: 'Transactions', value: completedTx, icon: '↔', color: '#f59e0b', bg: '#fffbeb', change: 'Ce mois' },
          { label: 'Prêts actifs', value: activeLoans, icon: '📋', color: '#ef4444', bg: '#fef2f2', change: `${loans.length} total` },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: '16px', padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.78rem', color: stat.color, marginTop: '0.4rem', fontWeight: 500 }}>
                  {stat.change}
                </p>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: stat.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.4rem'
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>

        {/* Évolution du solde */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>
            📈 Évolution du solde
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={balanceData}>
              <defs>
                <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`${v.toLocaleString()} XOF`, 'Solde']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="solde" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#colorSolde)" dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition comptes */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>
            🥧 Répartition comptes
          </h3>
          {accountData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={accountData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="value">
                  {accountData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v.toLocaleString()} XOF`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>💳</span>
              <span style={{ fontSize: '0.85rem' }}>Aucun compte</span>
            </div>
          )}
        </div>
      </div>

      {/* Transactions de la semaine */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>
            📊 Activité de la semaine
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={txData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="transactions" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actions rapides */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>
            ⚡ Actions rapides
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { to: '/accounts', icon: '💳', label: 'Nouveau compte', color: '#6366f1', bg: '#eef2ff' },
              { to: '/transactions', icon: '↔', label: 'Virement', color: '#22c55e', bg: '#f0fdf4' },
              { to: '/loans', icon: '📋', label: 'Demander prêt', color: '#f59e0b', bg: '#fffbeb' },
              { to: '/documents', icon: '📄', label: 'KYC Document', color: '#06b6d4', bg: '#ecfeff' },
            ].map((action, i) => (
              <Link key={i} to={action.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: action.bg, borderRadius: '12px', padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  cursor: 'pointer', transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: action.color }}>{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Comptes */}
      {accounts.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>💳 Mes comptes</h3>
            <Link to="/accounts" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
              Voir tout →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                borderRadius: '14px', padding: '1.25rem', color: 'white',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: -30, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {acc.type}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px',
                    background: acc.status === 'ACTIVE' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    color: acc.status === 'ACTIVE' ? '#86efac' : '#fca5a5',
                  }}>
                    {acc.status}
                  </span>
                </div>
                <p style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {acc.balance?.toLocaleString()} <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{acc.currency}</span>
                </p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, fontFamily: 'monospace' }}>
                  {acc.accountNumber}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
