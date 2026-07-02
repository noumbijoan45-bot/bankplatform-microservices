import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Loans from './pages/Loans'
import Customers from './pages/Customers'
import Documents from './pages/Documents'
import LoanValidation from './pages/LoanValidation'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (!['SUPER_ADMIN', 'OPERATOR_ADMIN', 'OPERATOR_ANALYST'].includes(user.role)) {
    return <Navigate to="/dashboard" />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar — visible seulement si connecté */}
      {user && <Sidebar />}

      {/* Contenu principal */}
      <main style={{
        flex: 1,
        marginLeft: user ? '240px' : '0',
        background: '#f1f5f9',
        minHeight: '100vh',
        transition: 'margin-left 0.25s ease',
      }}>
        <Routes>
          <Route path="/login"    element={!user ? <Login />    : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/accounts" element={
            <ProtectedRoute><Accounts /></ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute><Transactions /></ProtectedRoute>
          } />
          <Route path="/loans" element={
            <ProtectedRoute><Loans /></ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute><Documents /></ProtectedRoute>
          } />
          <Route path="/customers" element={
            <AdminRoute><Customers /></AdminRoute>
          } />
          <Route path="/loan-validation" element={
            <AdminRoute><LoanValidation /></AdminRoute>
          } />

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
