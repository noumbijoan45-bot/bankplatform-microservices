import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: '10px', color: 'white', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>

      {/* Panneau gauche */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏦</div>
          <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem' }}>
            CorBank
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: '300px', lineHeight: 1.6 }}>
            Rejoignez notre plateforme bancaire et profitez de services financiers modernes et sécurisés.
          </p>
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '✅', text: 'Ouverture de compte gratuite' },
              { icon: '💸', text: 'Transferts instantanés' },
              { icon: '📊', text: 'Suivi en temps réel' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                <span style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.icon}
                </span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ width: '520px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Créer un compte
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Rejoignez CorBank aujourd'hui</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'firstName', label: 'Prénom', placeholder: 'Jean' },
                { name: 'lastName', label: 'Nom', placeholder: 'Dupont' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>{f.label}</label>
                  <input name={f.name} value={form[f.name]} onChange={handleChange}
                    placeholder={f.placeholder} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                    onBlur={e => e.target.style.borderColor = '#334155'} />
                </div>
              ))}
            </div>

            {[
              { name: 'email', label: 'Email', type: 'email', placeholder: 'vous@exemple.com' },
              { name: 'phoneNumber', label: 'Téléphone', type: 'tel', placeholder: '+225 00 00 00 00' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>{f.label}</label>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange}
                  placeholder={f.placeholder} required={f.name === 'email'} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#22c55e'}
                  onBlur={e => e.target.style.borderColor = '#334155'} />
              </div>
            ))}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Minimum 8 caractères" required minLength={8}
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={e => e.target.style.borderColor = '#22c55e'}
                  onBlur={e => e.target.style.borderColor = '#334155'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.85rem',
              background: loading ? '#065f46' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', borderRadius: '10px', color: 'white',
              fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Inscription...</>
              ) : 'Créer mon compte →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#86efac', textDecoration: 'none', fontWeight: 500 }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
