import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface SlownikRodzaj {
  id: number;
  nazwa: string;
  kodPwz: string;
}

interface SlownikOrgan {
  id: number;
  kod: string;
  nazwa: string;
  typPersonelu: string;
}

export default function EditOsobaStep3Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [uprawnienia, setUprawnienia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    rodzaj: '',
    npwzIdRizh: '',
    organRejestrujacy: '',
    dataUzyciaUprawnienia: ''
  });
  
  // Słowniki
  const [slownikRodzajow, setSlownikRodzajow] = useState<SlownikRodzaj[]>([]);
  const [slownikOrgany, setSlownikOrgany] = useState<SlownikOrgan[]>([]);
  const [filteredOrgany, setFilteredOrgany] = useState<SlownikOrgan[]>([]);
  
  // Wyszukiwanie
  const [rodzajSearch, setRodzajSearch] = useState('');
  const [organSearch, setOrganSearch] = useState('');
  const [showRodzajDropdown, setShowRodzajDropdown] = useState(false);
  const [showOrganDropdown, setShowOrganDropdown] = useState(false);
  
  const rodzajRef = useRef<HTMLDivElement>(null);
  const organRef = useRef<HTMLDivElement>(null);

  const loadUprawnienia = () => {
    api.get(`/api/UprawnieniZawodowe/osoba/${id}`)
      .then(res => {
        setUprawnienia(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania uprawnień zawodowych:', err);
        setLoading(false);
      });
  };

  const loadSlowniki = async () => {
    try {
      const [slownikRes, organyRes] = await Promise.all([
        api.get('/api/UprawnieniZawodowe/slownik/rodzaj'),
        api.get('/api/UprawnieniZawodowe/slownik/organy')
      ]);

      setSlownikRodzajow(slownikRes.data);
      setSlownikOrgany(organyRes.data);
    } catch (err) {
      console.error('Błąd podczas pobierania słowników:', err);
    }
  };

  useEffect(() => {
    loadUprawnienia();
    loadSlowniki();
  }, [id]);

  // Filtruj organy po wyborze rodzaju
  useEffect(() => {
    if (formData.rodzaj) {
      const filtered = slownikOrgany.filter(o => 
        o.typPersonelu.toLowerCase() === formData.rodzaj.toLowerCase()
      );
      setFilteredOrgany(filtered);
      // Resetuj organ jeśli zmieniono rodzaj
      if (!filtered.find(o => o.nazwa === formData.organRejestrujacy)) {
        setFormData(prev => ({ ...prev, organRejestrujacy: '' }));
        setOrganSearch('');
      }
    } else {
      setFilteredOrgany([]);
    }
  }, [formData.rodzaj, slownikOrgany]);

  // Zamknij dropdowny po kliknięciu poza nimi
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rodzajRef.current && !rodzajRef.current.contains(event.target as Node)) {
        setShowRodzajDropdown(false);
      }
      if (organRef.current && !organRef.current.contains(event.target as Node)) {
        setShowOrganDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => {
    navigate(`/edytuj-osobe-step2/${id}`, { state: location.state });
  };

  const handleNext = () => {
    navigate(`/edytuj-osobe-step4/${id}`, { state: location.state });
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      rodzaj: '',
      npwzIdRizh: '',
      organRejestrujacy: '',
      dataUzyciaUprawnienia: ''
    });
    setRodzajSearch('');
    setOrganSearch('');
    setShowModal(true);
  };

  const handleEdit = (uprawnienie: any) => {
    setEditingId(uprawnienie.id);
    setFormData({
      rodzaj: uprawnienie.rodzaj || '',
      npwzIdRizh: uprawnienie.npwzIdRizh || '',
      organRejestrujacy: uprawnienie.organRejestrujacy || '',
      dataUzyciaUprawnienia: uprawnienie.dataUzyciaUprawnienia ? uprawnienie.dataUzyciaUprawnienia.split('T')[0] : ''
    });
    setRodzajSearch(uprawnienie.rodzaj || '');
    setOrganSearch(uprawnienie.organRejestrujacy || '');
    setShowModal(true);
  };

  const handleSelectRodzaj = (r: SlownikRodzaj) => {
    setFormData({ ...formData, rodzaj: r.nazwa, organRejestrujacy: '' });
    setRodzajSearch(r.nazwa);
    setOrganSearch('');
    setShowRodzajDropdown(false);
  };

  const handleSelectOrgan = (o: SlownikOrgan) => {
    setFormData({ ...formData, organRejestrujacy: o.nazwa });
    setOrganSearch(o.nazwa);
    setShowOrganDropdown(false);
  };

  const handleDelete = async (uprId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to uprawnienie zawodowe?')) {
      return;
    }

    try {
      await api.delete(`/api/UprawnieniZawodowe/${uprId}`);
      loadUprawnienia();
      showToast('Uprawnienie zawodowe zostało usunięte', 'success');
    } catch (err) {
      console.error('Błąd podczas usuwania:', err);
      showToast('Błąd podczas usuwania uprawnienia zawodowego', 'error');
    }
  };

  const handleModalSubmit = async () => {
    if (!formData.rodzaj) {
      showToast('Wybierz rodzaj uprawnienia zawodowego', 'warning');
      return;
    }

    try {
      const payload = {
        ...formData,
        osobaId: Number(id)
      };

      if (editingId) {
        await api.put(`/api/UprawnieniZawodowe/${editingId}`, payload);
        showToast('Uprawnienie zawodowe zostało zaktualizowane', 'success');
      } else {
        await api.post('/api/UprawnieniZawodowe', payload);
        showToast('Uprawnienie zawodowe zostało dodane', 'success');
      }

      setShowModal(false);
      loadUprawnienia();
    } catch (err: any) {
      console.error('Błąd podczas zapisywania:', err);
      showToast(`Błąd podczas zapisywania danych: ${err.response?.data?.error || err.message}`, 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  const filteredRodzaje = slownikRodzajow.filter(r => 
    r.nazwa.toLowerCase().includes(rodzajSearch.toLowerCase())
  );

  const displayOrgany = filteredOrgany.filter(o =>
    o.nazwa.toLowerCase().includes(organSearch.toLowerCase())
  );

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ color: '#0044cc', marginBottom: '1.5rem' }}>
        Edycja danych osoby personelu - Uprawnienia zawodowe
      </h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Dodaj
        </button>
      </div>

      {uprawnienia.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#b8d4f7' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', width: '50px' }}>Lp.</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Rodzaj</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>NPWZ/Id RIZM</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Organ rejestrujący</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Data uzyskania</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Operacje</th>
            </tr>
          </thead>
          <tbody>
            {uprawnienia.map((u, index) => (
              <tr key={u.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.rodzaj}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.npwzIdRizh}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.organRejestrujacy}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  {u.dataUzyciaUprawnienia ? u.dataUzyciaUprawnienia.split('T')[0] : ''}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(u)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>edycja</button>
                  <br />
                  <button onClick={() => handleDelete(u.id)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666', backgroundColor: '#f8f9fa', marginBottom: '1.5rem' }}>
          Brak danych
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0044cc' }}>
              {editingId ? 'Edytuj uprawnienie zawodowe' : 'Dodaj uprawnienie zawodowe'}
            </h3>

            {/* Rodzaj uprawnienia zawodowego */}
            <div style={{ marginBottom: '1rem' }} ref={rodzajRef}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Rodzaj uprawnienia zawodowego: <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={rodzajSearch}
                  onChange={(e) => {
                    setRodzajSearch(e.target.value);
                    setShowRodzajDropdown(true);
                    if (e.target.value === '') {
                      setFormData({ ...formData, rodzaj: '', organRejestrujacy: '' });
                      setOrganSearch('');
                    }
                  }}
                  onFocus={() => setShowRodzajDropdown(true)}
                  placeholder="Wpisz aby wyszukać..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                {showRodzajDropdown && filteredRodzaje.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    zIndex: 1001
                  }}>
                    {filteredRodzaje.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRodzaj(r)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          backgroundColor: formData.rodzaj === r.nazwa ? '#e3f2fd' : 'white'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = formData.rodzaj === r.nazwa ? '#e3f2fd' : 'white')}
                      >
                        <div style={{ fontWeight: 'bold' }}>{r.nazwa}</div>
                        {r.kodPwz && <div style={{ fontSize: '12px', color: '#666' }}>Typ PWZ: {r.kodPwz}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.rodzaj && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#28a745' }}>
                  ✓ Wybrano: {formData.rodzaj}
                </div>
              )}
            </div>

            {/* NPWZ/Id RIZM */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                NPWZ/Id RIZM:
              </label>
              <input
                type="text"
                value={formData.npwzIdRizh}
                onChange={(e) => setFormData({ ...formData, npwzIdRizh: e.target.value })}
                placeholder="Wpisz numer PWZ lub Id RIZM"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Organ rejestrujący */}
            <div style={{ marginBottom: '1rem' }} ref={organRef}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Organ rejestrujący:
              </label>
              {!formData.rodzaj ? (
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', color: '#666', fontSize: '14px' }}>
                  Najpierw wybierz rodzaj uprawnienia zawodowego
                </div>
              ) : filteredOrgany.length === 0 ? (
                <div style={{ padding: '8px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', color: '#856404', fontSize: '14px' }}>
                  Brak organów rejestrujących dla wybranego typu personelu
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={organSearch}
                    onChange={(e) => {
                      setOrganSearch(e.target.value);
                      setShowOrganDropdown(true);
                    }}
                    onFocus={() => setShowOrganDropdown(true)}
                    placeholder="Wpisz aby wyszukać organ..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  {showOrganDropdown && displayOrgany.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      zIndex: 1001
                    }}>
                      {displayOrgany.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => handleSelectOrgan(o)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            fontSize: '13px',
                            backgroundColor: formData.organRejestrujacy === o.nazwa ? '#e3f2fd' : 'white'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = formData.organRejestrujacy === o.nazwa ? '#e3f2fd' : 'white')}
                        >
                          <strong>{o.kod}</strong> - {o.nazwa}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {formData.organRejestrujacy && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#28a745' }}>
                  ✓ Wybrano: {formData.organRejestrujacy}
                </div>
              )}
            </div>

            {/* Data uzyskania */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Data uzyskania: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.dataUzyciaUprawnienia}
                onChange={(e) => setFormData({ ...formData, dataUzyciaUprawnienia: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
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
                onClick={handleModalSubmit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#666', marginBottom: '1.5rem' }}>* pola wymagane</div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={handleCancel}
          style={{
            padding: '8px 20px',
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
          onClick={handleBack}
          style={{
            padding: '8px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Wstecz
        </button>
        <button
          onClick={handleNext}
          style={{
            padding: '8px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Dalej →
        </button>
      </div>
    </div>
  );
}
