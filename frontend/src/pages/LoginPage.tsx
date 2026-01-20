import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface LoginRequest {
  username: string;
  password: string;
  totpCode?: string;
}

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [form, setForm] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const loginData = requires2FA 
        ? { ...form, totpCode } 
        : form;
      
      const res = await api.post('/api/Login', loginData);
      
      if (res.status === 200) {
        // Sprawdź czy wymaga 2FA
        if (res.data.requiresTwoFactor) {
          setRequires2FA(true);
          setTempUserId(res.data.userId);
          setError('');
          return;
        }
        
        // Zapisz userId do localStorage dla funkcji 2FA
        if (res.data.id) {
          localStorage.setItem('userId', res.data.id.toString());
        }
        // Zapisz rolę użytkownika
        if (res.data.role) {
          localStorage.setItem('userRole', res.data.role);
        }
        onLogin();
        // Zawsze przekieruj do listy osób
        navigate('/osoby');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError(err.response?.data || 'Nieprawidłowy login, hasło lub kod uwierzytelniający.');
      } else {
        setError('Nieprawidłowa nazwa użytkownika lub hasło.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTotpCode('');
    setError('');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5',
      paddingTop: '40px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: '0',
        color: '#2c3e50',
        fontSize: '42px',
        fontWeight: '700',
        textShadow: '2px 2px 4px rgba(0,0,0,0.15)'
      }}>
        System Zarządzania Szpitalną Kadrą
      </h1>
      <div style={{
        display: 'flex',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h2 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#333',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          {requires2FA ? '🔐 Weryfikacja 2FA' : 'Logowanie'}
        </h2>

        {!requires2FA ? (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#555',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Nazwa użytkownika
              </label>
              <input
                type="text"
                name="username"
                placeholder="Wprowadź nazwę użytkownika"
                value={form.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#555',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Hasło
              </label>
              <input
                type="password"
                name="password"
                placeholder="Wprowadź hasło"
                value={form.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <button 
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#007bff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            >
              Zaloguj
            </button>
          </>
        ) : (
          <>
            <p style={{ 
              color: '#666', 
              textAlign: 'center', 
              marginBottom: '1.5rem' 
            }}>
              Wprowadź 6-cyfrowy kod z aplikacji<br/>
              Microsoft Authenticator lub Google Authenticator
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                maxLength={6}
                autoFocus
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '28px',
                  textAlign: 'center',
                  letterSpacing: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={totpCode.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: totpCode.length === 6 ? '#28a745' : '#6c757d',
                border: 'none',
                borderRadius: '4px',
                cursor: totpCode.length === 6 ? 'pointer' : 'not-allowed',
                marginBottom: '0.5rem'
              }}
            >
              Potwierdź
            </button>

            <button 
              onClick={handleBack}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                color: '#6c757d',
                backgroundColor: 'transparent',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Wróć
            </button>
          </>
        )}

        {error && (
          <p style={{ 
            color: '#dc3545', 
            textAlign: 'center',
            marginTop: '1rem',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
