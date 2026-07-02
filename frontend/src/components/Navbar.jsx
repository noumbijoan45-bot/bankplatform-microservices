import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationApi } from '../api/axios'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.get('/notifications/history')
      setNotifications(res.data || [])
    } catch (err) {
      // Silencieux si le service est indisponible
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'OPERATOR_ANALYST'].includes(user?.role)
  const unreadCount = notifications.filter(n => n.status === 'SENT').length

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">🏦 CorBank</Link>

      <ul className="navbar-links">
        <li><Link to="/dashboard">Tableau de bord</Link></li>
        <li><Link to="/accounts">Comptes</Link></li>
        <li><Link to="/transactions">Transactions</Link></li>
        <li><Link to="/loans">Prêts</Link></li>
        <li><Link to="/documents">Documents</Link></li>
        {isAdmin && <li><Link to="/customers">Clients</Link></li>}
      </ul>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>

        {/* Cloche de notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.4rem', color: 'white', position: 'relative'
            }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#ef5350', color: 'white', borderRadius: '50%',
                width: '18px', height: '18px', fontSize: '0.7rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Panneau notifications */}
          {showNotif && (
            <div style={{
              position: 'absolute', top: '40px', right: 0,
              background: 'white', borderRadius: '12px', width: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 1000,
              maxHeight: '400px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '1rem', borderBottom: '1px solid #eee',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <strong style={{ color: '#1a237e' }}>Notifications</strong>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {notifications.length} message(s)
                </span>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '330px' }}>
                {notifications.length === 0 ? (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                    Aucune notification
                  </p>
                ) : (
                  notifications.slice(0, 10).map((notif, idx) => (
                    <div key={idx} style={{
                      padding: '0.8rem 1rem',
                      borderBottom: '1px solid #f5f5f5',
                      background: notif.status === 'SENT' ? '#f3f8ff' : 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          color: notif.type === 'SMS' ? '#1565c0' : '#2e7d32',
                          background: notif.type === 'SMS' ? '#e3f2fd' : '#e8f5e9',
                          padding: '1px 6px', borderRadius: '4px'
                        }}>
                          {notif.type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>
                          {notif.sentAt ? new Date(notif.sentAt).toLocaleTimeString('fr-FR') : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#333', margin: 0 }}>
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>
          {user?.firstName} {user?.lastName}
        </span>
        <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
      </div>
    </nav>
  )
}
