import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const DOCUMENT_SERVICE = 'http://localhost:8087'

const docTypes = [
  { value: 'CNI', label: "Carte Nationale d'Identité", icon: '🪪' },
  { value: 'PASSPORT', label: 'Passeport', icon: '📗' },
  { value: 'JUSTIFICATIF_DOMICILE', label: 'Justificatif de domicile', icon: '🏠' },
  { value: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', icon: '💼' },
  { value: 'RELEVE_BANCAIRE', label: 'Relevé bancaire', icon: '🏦' },
  { value: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', icon: '📄' },
  { value: 'DOCUMENT_ADMINISTRATIF', label: 'Document administratif', icon: '📋' },
]

export default function Documents() {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('CNI')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [kycFile, setKycFile] = useState(null)
  const [kycResult, setKycResult] = useState(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) { setError('Veuillez sélectionner un fichier'); return }
    setLoading(true); setError(''); setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', docType)
    formData.append('customer_id', user?.userId || '')
    try {
      const res = await axios.post(`${DOCUMENT_SERVICE}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du traitement')
    } finally { setLoading(false) }
  }

  const handleKYC = async (e) => {
    e.preventDefault()
    if (!kycFile) { setError('Veuillez sélectionner votre CNI'); return }
    setKycLoading(true); setError('')
    const formData = new FormData()
    formData.append('cni_file', kycFile)
    formData.append('customer_id', user?.userId || '')
    formData.append('declared_first_name', user?.firstName || '')
    formData.append('declared_last_name', user?.lastName || '')
    try {
      const res = await axios.post(`${DOCUMENT_SERVICE}/documents/verify-kyc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setKycResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la vérification KYC')
    } finally { setKycLoading(false) }
  }

  const scoreColor = (s) => s >= 0.7 ? '#16a34a' : s >= 0.4 ? '#d97706' : '#dc2626'
  const scoreBg = (s) => s >= 0.7 ? '#f0fdf4' : s >= 0.4 ? '#fffbeb' : '#fef2f2'

  return (
    <div style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Documents & KYC</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Soumettez et vérifiez vos documents par reconnaissance optique (OCR/IA)</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Upload document */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📤</div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Analyser un document</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Extraction automatique par OCR</p>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            {/* Type sélection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Type de document
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {docTypes.map(dt => (
                  <button key={dt.value} type="button" onClick={() => setDocType(dt.value)}
                    style={{
                      padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                      border: docType === dt.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      background: docType === dt.value ? '#eef2ff' : 'white',
                      fontSize: '0.78rem', fontWeight: docType === dt.value ? 600 : 400,
                      color: docType === dt.value ? '#4f46e5' : '#64748b',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                    <span>{dt.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone de drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]) }}
              style={{
                border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '2rem', textAlign: 'center',
                background: dragOver ? '#eef2ff' : '#f8fafc', marginBottom: '1rem',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input id="fileInput" type="file" accept=".jpg,.jpeg,.png,.pdf,.bmp,.tiff"
                onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {file ? '📎' : '☁️'}
              </div>
              {file ? (
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{file.name}</p>
                  <p style={{ color: '#64748b', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Glissez votre fichier ici</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>ou cliquez pour parcourir — JPG, PNG, PDF</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !file} style={{
              width: '100%', padding: '0.8rem',
              background: !file ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: !file ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px',
              fontWeight: 600, cursor: file ? 'pointer' : 'not-allowed', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyse en cours...</>
              ) : '🔍 Analyser le document'}
            </button>
          </form>

          {/* Résultat analyse */}
          {result && (
            <div style={{ marginTop: '1.5rem', background: '#f8fafc', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  background: scoreBg(result.confidence_score),
                  color: scoreColor(result.confidence_score),
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                }}>
                  {result.verification_status}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Confiance</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor(result.confidence_score) }}>
                      {(result.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '99px', height: '6px' }}>
                    <div style={{ width: `${result.confidence_score * 100}%`, height: '100%', background: scoreColor(result.confidence_score), borderRadius: '99px' }} />
                  </div>
                </div>
              </div>

              {Object.keys(result.extracted_info || {}).length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Informations extraites</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {Object.entries(result.extracted_info).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'white', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vérification KYC */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔐</div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Vérification KYC</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Validation automatique d'identité par IA</p>
            </div>
          </div>

          {/* Info utilisateur */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{user?.firstName} {user?.lastName}</p>
              <p style={{ color: '#64748b', fontSize: '0.78rem' }}>Ces données seront comparées avec votre CNI</p>
            </div>
          </div>

          <form onSubmit={handleKYC}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Votre CNI (photo)
              </label>
              <div
                style={{
                  border: `2px dashed ${kycFile ? '#22c55e' : '#e2e8f0'}`,
                  borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
                  background: kycFile ? '#f0fdf4' : '#f8fafc', cursor: 'pointer',
                }}
                onClick={() => document.getElementById('kycInput').click()}
              >
                <input id="kycInput" type="file" accept=".jpg,.jpeg,.png"
                  onChange={e => setKycFile(e.target.files[0])} style={{ display: 'none' }} />
                <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{kycFile ? '✅' : '🪪'}</div>
                {kycFile ? (
                  <p style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.85rem' }}>{kycFile.name}</p>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Cliquez pour sélectionner votre CNI</p>
                )}
              </div>
            </div>

            <button type="submit" disabled={kycLoading || !kycFile} style={{
              width: '100%', padding: '0.8rem',
              background: !kycFile ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: !kycFile ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px',
              fontWeight: 600, cursor: kycFile ? 'pointer' : 'not-allowed', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {kycLoading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Vérification...</>
              ) : '✓ Lancer la vérification KYC'}
            </button>
          </form>

          {/* Résultat KYC */}
          {kycResult && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{
                borderRadius: '12px', padding: '1.5rem',
                background: kycResult.kyc_status === 'PASSED' ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fffbeb,#fef3c7)',
                border: `1px solid ${kycResult.kyc_status === 'PASSED' ? '#bbf7d0' : '#fde68a'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{kycResult.kyc_status === 'PASSED' ? '✅' : '⚠️'}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: kycResult.kyc_status === 'PASSED' ? '#15803d' : '#92400e' }}>
                      {kycResult.kyc_status === 'PASSED' ? 'KYC Validé' : 'Révision requise'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: kycResult.kyc_status === 'PASSED' ? '#16a34a' : '#d97706' }}>
                      {kycResult.recommendation}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'white', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#64748b' }}>Nom correspondant : </span>
                    <span style={{ fontWeight: 600, color: kycResult.name_match ? '#16a34a' : '#dc2626' }}>
                      {kycResult.name_match ? '✓ Oui' : '✗ Non'}
                    </span>
                  </div>
                  <div style={{ background: 'white', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#64748b' }}>Score : </span>
                    <span style={{ fontWeight: 600, color: scoreColor(kycResult.confidence_score) }}>
                      {(kycResult.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
