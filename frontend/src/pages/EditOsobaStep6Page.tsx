import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface SlownikDoswiadczenia {
  id: number;
  kod: string;
  nazwa: string;
  opis: string;
}

export default function EditOsobaStep6Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [doswiadczenia, setDoswiadczenia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    kod: '',
    nazwa: '',
    zaswiadczenie: ''
  });
  
  // Słownik doświadczenia zawodowego
  const [slownikDoswiadczenia, setSlownikDoswiadczenia] = useState<SlownikDoswiadczenia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDoswiadczenie, setSelectedDoswiadczenie] = useState<SlownikDoswiadczenia | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadDoswiadczenia = () => {
    console.log('Ładowanie doświadczeń dla osoby ID:', id);
    api.get(`/api/DoswiadczenieZawodowe/osoba/${id}`)
      .then(res => {
        console.log('Pobrane doświadczenia:', res.data);
        setDoswiadczenia(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania doświadczenia:', err);
        setLoading(false);
      });
  };

  const loadSlownikDoswiadczenia = async () => {
    try {
      const res = await api.get('/api/DoswiadczenieZawodowe/slownik');
      setSlownikDoswiadczenia(res.data);
    } catch (err) {
      console.error('Błąd podczas pobierania słownika doświadczenia:', err);
    }
  };

  useEffect(() => {
    loadDoswiadczenia();
    loadSlownikDoswiadczenia();
  }, [id]);

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDoswiadczenia = slownikDoswiadczenia.filter(d =>
    d.nazwa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.kod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    console.log('Kliknięto przycisk Dodaj - otwieranie modala');
    setEditingId(null);
    setFormData({ kod: '', nazwa: '', zaswiadczenie: '' });
    setSelectedDoswiadczenie(null);
    setSearchTerm('');
    setShowModal(true);
  };

  const handleEdit = (doswiadczenie: any) => {
    setEditingId(doswiadczenie.id);
    setFormData({
      kod: doswiadczenie.kod || '',
      nazwa: doswiadczenie.nazwa || '',
      zaswiadczenie: doswiadczenie.zaswiadczenie || ''
    });
    // Znajdź odpowiadającą pozycję ze słownika
    const found = slownikDoswiadczenia.find(d => d.kod === doswiadczenie.kod);
    setSelectedDoswiadczenie(found || null);
    setSearchTerm(found ? `${found.kod} - ${found.nazwa}` : '');
    setShowModal(true);
  };

  const handleSelectDoswiadczenie = (d: SlownikDoswiadczenia) => {
    setSelectedDoswiadczenie(d);
    setFormData({
      ...formData,
      kod: d.kod,
      nazwa: d.nazwa
    });
    setSearchTerm(`${d.kod} - ${d.nazwa}`);
    setShowDropdown(false);
  };

  const handleDelete = (delId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to doświadczenie?')) return;
    api.delete(`/api/DoswiadczenieZawodowe/${delId}`)
      .then(() => {
        loadDoswiadczenia();
      })
      .catch(err => {
        console.error('Błąd podczas usuwania doświadczenia:', err);
        showToast('Wystąpił błąd podczas usuwania doświadczenia', 'error');
      });
  };

  const handleModalSubmit = async () => {
    if (!formData.kod || !formData.nazwa) {
      showToast('Wybierz doświadczenie zawodowe ze słownika', 'warning');
      return;
    }

    const payload = {
      ...formData,
      osobaId: Number(id)
    };

    console.log('Wysyłane dane:', payload);

    try {
      if (editingId) {
        const response = await api.put(`/api/DoswiadczenieZawodowe/${editingId}`, { ...payload, id: editingId });
        console.log('Odpowiedź PUT:', response.data);
        showToast('Doświadczenie zostało zaktualizowane', 'success');
      } else {
        const response = await api.post('/api/DoswiadczenieZawodowe', payload);
        console.log('Odpowiedź POST:', response.data);
        showToast('Doświadczenie zostało dodane', 'success');
      }
      setShowModal(false);
      loadDoswiadczenia();
    } catch (err: any) {
      console.error('Błąd podczas zapisywania doświadczenia:', err);
      console.error('Szczegóły błędu:', err.response?.data);
      showToast(`Błąd podczas zapisywania danych: ${err.response?.data?.error || err.message}`, 'error');
    }
  };

  const handleBack = () => {
    navigate(`/edytuj-osobe-step5/${id}`, { state: location.state });
  };

  const handleNext = () => {
    navigate(`/edytuj-osobe-step7/${id}`, { state: location.state });
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ color: '#0044cc', marginBottom: '1.5rem' }}>
        Edycja danych osoby personelu - Doświadczenie zawodowe
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

      {doswiadczenia.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#b8d4f7' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', width: '50px' }}>Lp.</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Kod</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Nazwa</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Zaświadczenie</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Typ zmian</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Operacje</th>
            </tr>
          </thead>
          <tbody>
            {doswiadczenia.map((d, index) => (
              <tr key={d.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{d.kod || ''}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {d.nazwa || ''}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{d.zaswiadczenie || ''}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>bez zmian</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(d)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', marginRight: '10px' }}>edytuj</button>
                  <button onClick={() => handleDelete(d.id)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>usuń</button>
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
              {editingId ? 'Edytuj doświadczenie zawodowe' : 'Dodaj doświadczenie zawodowe'}
            </h3>

            {/* Wyszukiwarka doświadczenia */}
            <div style={{ marginBottom: '1rem' }} ref={dropdownRef}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Doświadczenie zawodowe: <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Wpisz kod lub nazwę doświadczenia..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                {showDropdown && filteredDoswiadczenia.length > 0 && (
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
                    {filteredDoswiadczenia.slice(0, 50).map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelectDoswiadczenie(d)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px',
                          backgroundColor: selectedDoswiadczenie?.id === d.id ? '#e3f2fd' : 'white'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedDoswiadczenie?.id === d.id ? '#e3f2fd' : 'white')}
                      >
                        <strong>{d.kod}</strong> - {d.nazwa}
                      </div>
                    ))}
                    {filteredDoswiadczenia.length > 50 && (
                      <div style={{ padding: '8px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        ... i {filteredDoswiadczenia.length - 50} więcej. Zawęź wyszukiwanie.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedDoswiadczenie && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>Wybrano:</strong> {selectedDoswiadczenie.kod} - {selectedDoswiadczenie.nazwa}
                </div>
              )}
            </div>

            {/* Zaświadczenie */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Zaświadczenie:
              </label>
              <input
                type="text"
                value={formData.zaswiadczenie}
                onChange={(e) => setFormData({ ...formData, zaswiadczenie: e.target.value })}
                placeholder="Numer lub nazwa zaświadczenia"
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
                onClick={handleModalSubmit}
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
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
