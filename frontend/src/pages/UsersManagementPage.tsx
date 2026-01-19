import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface User {
  id: number;
  usename: string;
  role: string;
  totpEnabled: boolean;
  lastActivity: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reader');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Zmiana hasła
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [passwordUsername, setPasswordUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const userRole = localStorage.getItem('userRole') || '';

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/osoby');
      return;
    }
    fetchUsers();
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/DbUser');
      setUsers(res.data);
    } catch (err) {
      console.error('Błąd podczas pobierania użytkowników:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/DbUser/create', {
        username,
        password,
        role
      });
      showToast('Użytkownik został utworzony!', 'success');
      setShowAddModal(false);
      setUsername('');
      setPassword('');
      setRole('reader');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data || 'Błąd podczas tworzenia użytkownika.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/DbUser/${id}`);
      showToast('Użytkownik został usunięty.', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data || 'Błąd podczas usuwania użytkownika.', 'error');
    }
  };

  const openPasswordModal = (userId: number, username: string) => {
    setPasswordUserId(userId);
    setPasswordUsername(username);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!passwordUserId) return;
    if (!newPassword || newPassword.length < 4) {
      showToast('Hasło musi mieć co najmniej 4 znaki.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put(`/api/DbUser/${passwordUserId}/password`, { newPassword });
      showToast(`Hasło użytkownika "${passwordUsername}" zostało zmienione.`, 'success');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      showToast(err.response?.data || 'Błąd podczas zmiany hasła.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'reader': return 'Czytelnik';
      case 'writer': return 'Dodający';
      default: return role;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL');
  };

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>Zarządzanie użytkownikami</h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          + Dodaj użytkownika
        </button>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left', fontWeight: '600' }}>Nazwa użytkownika</th>
            <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left', fontWeight: '600' }}>Rola</th>
            <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left', fontWeight: '600' }}>2FA</th>
            <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ostatnia aktywność</th>
            <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left', fontWeight: '600' }}>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
              <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>{user.usename}</td>
              <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: user.role === 'admin' ? '#dc3545' : user.role === 'writer' ? '#007bff' : '#6c757d',
                  color: 'white'
                }}>
                  {getRoleLabel(user.role)}
                </span>
              </td>
              <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>
                {user.totpEnabled ? '✅ Włączone' : '❌ Wyłączone'}
              </td>
              <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>{formatDate(user.lastActivity)}</td>
              <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => openPasswordModal(user.id, user.usename)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Hasło
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(user.id, user.usename || '')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Usuń
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal dodawania użytkownika */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '400px', maxWidth: '90%'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Dodaj nowego użytkownika</h2>
            
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Nazwa użytkownika:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Hasło:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Rola:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="reader">Czytelnik (tylko podgląd)</option>
                  <option value="writer">Dodający (może edytować)</option>
                </select>
              </div>

              {error && (
                <div style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setUsername('');
                    setPassword('');
                    setRole('reader');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {loading ? 'Tworzenie...' : 'Utwórz użytkownika'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal zmiany hasła */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '2rem',
            maxWidth: '400px', width: '90%'
          }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              🔑 Zmiana hasła
            </h2>
            <p style={{ marginBottom: '1rem', textAlign: 'center', color: '#666' }}>
              Użytkownik: <strong>{passwordUsername}</strong>
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Nowe hasło:
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Wpisz nowe hasło"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Hasło musi mieć co najmniej 4 znaki.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Anuluj
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: passwordLoading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {passwordLoading ? 'Zapisywanie...' : 'Zmień hasło'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
