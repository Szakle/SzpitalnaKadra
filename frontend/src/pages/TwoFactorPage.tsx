import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getTwoFactorStatus, setupTwoFactor, verifyTwoFactor, disableTwoFactor, TwoFactorSetupResponse } from '../services/api';

const TwoFactorPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userId = localStorage.getItem('userId');

  const loadStatus = async () => {
    if (!userId) {
      setError('Nie można pobrać danych użytkownika. Wyloguj się i zaloguj ponownie.');
      setLoading(false);
      return;
    }
    try {
      const status = await getTwoFactorStatus(parseInt(userId!));
      setTotpEnabled(status.totpEnabled);
    } catch (err) {
      setError('Nie udało się pobrać statusu 2FA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetup = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await setupTwoFactor(parseInt(userId!));
      setSetupData(data);
    } catch (err: any) {
      setError(err.response?.data || 'Błąd podczas generowania kodu QR');
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Kod musi mieć 6 cyfr');
      return;
    }
    setError('');
    try {
      await verifyTwoFactor(parseInt(userId!), code);
      setSuccess('2FA zostało pomyślnie włączone!');
      setTotpEnabled(true);
      setSetupData(null);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data || 'Nieprawidłowy kod');
    }
  };

  const handleDisable = async () => {
    if (code.length !== 6) {
      setError('Podaj kod z aplikacji aby wyłączyć 2FA');
      return;
    }
    if (!window.confirm('Czy na pewno chcesz wyłączyć uwierzytelnianie dwuskładnikowe?')) {
      return;
    }
    setError('');
    try {
      await disableTwoFactor(parseInt(userId!), code);
      setSuccess('2FA zostało wyłączone');
      setTotpEnabled(false);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data || 'Nieprawidłowy kod');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>🔐 Uwierzytelnianie dwuskładnikowe (2FA)</h1>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <strong>Status:</strong>{' '}
          <span style={{ color: totpEnabled ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
            {totpEnabled ? '✅ Włączone' : '❌ Wyłączone'}
          </span>
        </div>

        {!totpEnabled && !setupData && (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Uwierzytelnianie dwuskładnikowe (2FA) dodaje dodatkową warstwę bezpieczeństwa do Twojego konta.
              Po włączeniu, będziesz musiał podać kod z aplikacji Microsoft Authenticator lub Google Authenticator przy każdym logowaniu.
            </p>
            <button
              onClick={handleSetup}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Włącz 2FA
            </button>
          </div>
        )}

        {setupData && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Krok 1: Zeskanuj kod QR</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Otwórz aplikację Microsoft Authenticator lub Google Authenticator i zeskanuj poniższy kod QR:
            </p>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <QRCodeSVG 
                value={setupData.qrCodeUri}
                size={200}
                level="M"
                style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', background: 'white' }}
              />
            </div>

            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
              Lub wpisz ręcznie klucz:
            </p>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px', 
              fontFamily: 'monospace',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '1.5rem',
              wordBreak: 'break-all'
            }}>
              {setupData.manualEntryKey}
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Krok 2: Wprowadź kod weryfikacyjny</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Wpisz 6-cyfrowy kod z aplikacji aby aktywować 2FA:
            </p>
            
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
            
            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: code.length === 6 ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Aktywuj 2FA
            </button>

            <button
              onClick={() => setSetupData(null)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '0.5rem'
              }}
            >
              Anuluj
            </button>
          </div>
        )}

        {totpEnabled && (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Twoje konto jest chronione uwierzytelnianiem dwuskładnikowym.
              Aby wyłączyć 2FA, wprowadź aktualny kod z aplikacji:
            </p>
            
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
            
            <button
              onClick={handleDisable}
              disabled={code.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: code.length === 6 ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Wyłącz 2FA
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#007bff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Wróć
        </button>
      </div>
    </div>
  );
};

export default TwoFactorPage;
