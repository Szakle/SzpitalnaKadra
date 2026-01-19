import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface SlownikSpecjalizacja {
  id: number;
  kod: string;
  nazwa: string;
}

const STOPNIE_SPECJALIZACJI = [
  'bez specjalizacji',
  'w trakcie',
  '1 st. specjalizacji',
  'specjalista'
];

export default function EditOsobaStep3Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [zawody, setZawody] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    kod: '',
    nazwa: '',
    stopienSpecjalizacji: '',
    dataUzyskaniaSpecjalizacji: '',
    dyplom: ''
  });
  
  // Słownik specjalizacji
  const [slownikSpecjalizacji, setSlownikSpecjalizacji] = useState<SlownikSpecjalizacja[]>([]);
  const [specjalizacjaSearch, setSpecjalizacjaSearch] = useState('');
  const [showSpecjalizacjaDropdown, setShowSpecjalizacjaDropdown] = useState(false);

  const loadZawody = () => {
    api.get(`/api/ZawodySpecjalnosci/osoba/${id}`)
      .then(res => {
        setZawody(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania zawodów/specjalności:', err);
        setLoading(false);
      });
  };

  const loadSlownik = async () => {
    try {
      const res = await api.get('/api/ZawodySpecjalnosci/slownik/specjalizacja');
      console.log('Załadowano słownik specjalizacji:', res.data);
      setSlownikSpecjalizacji(res.data);
    } catch (err) {
      console.error('Błąd podczas pobierania słownika:', err);
    }
  };

  useEffect(() => {
    loadZawody();
    loadSlownik();
  }, [id]);

  const handleBack = () => {
    navigate(`/edytuj-osobe-step3/${id}`, { state: location.state });
  };

  const handleNext = () => {
    navigate(`/edytuj-osobe-step5/${id}`, { state: location.state });
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      kod: '',
      nazwa: '',
      stopienSpecjalizacji: '',
      dataUzyskaniaSpecjalizacji: '',
      dyplom: ''
    });
    setSpecjalizacjaSearch('');
    setShowModal(true);
  };

  const handleEdit = (zawod: any) => {
    setEditingId(zawod.id);
    setFormData({
      kod: zawod.kod || '',
      nazwa: zawod.nazwa || '',
      stopienSpecjalizacji: zawod.stopienSpecjalizacji || '',
      dataUzyskaniaSpecjalizacji: zawod.dataUzyskaniaSpecjalizacji ? zawod.dataUzyskaniaSpecjalizacji.split('T')[0] : '',
      dyplom: zawod.dyplom || ''
    });
    setSpecjalizacjaSearch(zawod.kod && zawod.nazwa ? `${zawod.kod} - ${zawod.nazwa}` : (zawod.nazwa || ''));
    setShowModal(true);
  };

  const handleDelete = async (zawodId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten zawód/specjalność?')) {
      return;
    }

    try {
      await api.delete(`/api/ZawodySpecjalnosci/${zawodId}`);
      loadZawody();
      showToast('Zawód/specjalność został usunięty', 'success');
    } catch (err) {
      console.error('Błąd podczas usuwania:', err);
      showToast('Błąd podczas usuwania zawodu/specjalności', 'error');
    }
  };

  const handleModalSubmit = async () => {
    // Walidacja
    if (!formData.nazwa) {
      showToast('Pole "Zawód/specjalność" jest wymagane', 'warning');
      return;
    }
    if (!formData.stopienSpecjalizacji) {
      showToast('Pole "Stopień specjalizacji" jest wymagane', 'warning');
      return;
    }

    try {
      const payload = {
        ...formData,
        osobaId: Number(id)
      };

      console.log('Wysyłane dane do API:', payload);

      if (editingId) {
        const response = await api.put(`/api/ZawodySpecjalnosci/${editingId}`, payload);
        console.log('Odpowiedź PUT:', response.data);
        showToast('Zawód/specjalność został zaktualizowany', 'success');
      } else {
        const response = await api.post('/api/ZawodySpecjalnosci', payload);
        console.log('Odpowiedź POST:', response.data);
        showToast('Zawód/specjalność został dodany', 'success');
      }

      setShowModal(false);
      loadZawody();
    } catch (err: any) {
      console.error('Błąd podczas zapisywania:', err);
      showToast(`Błąd podczas zapisywania danych: ${err.response?.data?.error || err.message}`, 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ color: '#0044cc', marginBottom: '1.5rem' }}>
        Edycja danych osoby personelu - Zawody i specjalności
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

      {zawody.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#b8d4f7' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', width: '50px' }}>Lp.</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Kod</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Zawód/specjalność</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Stopień specjalizacji</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Data uzyskania specjalizacji</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Dyplom</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Operacje</th>
            </tr>
          </thead>
          <tbody>
            {zawody.map((z, index) => (
              <tr key={z.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.kod || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.nazwa || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.stopienSpecjalizacji || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  {z.dataUzyskaniaSpecjalizacji ? new Date(z.dataUzyskaniaSpecjalizacji).toLocaleDateString('pl-PL') : '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.dyplom || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(z)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>edycja</button>
                  <br />
                  <button onClick={() => handleDelete(z.id)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>usuń</button>
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

      {/* Modal do dodawania/edycji */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, color: '#0044cc' }}>
              {editingId ? 'Edytuj zawód/specjalność' : 'Dodaj zawód/specjalność'}
            </h3>
            
            {/* Zawód/specjalność - searchable select */}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Zawód/specjalność: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={specjalizacjaSearch}
                onChange={(e) => {
                  setSpecjalizacjaSearch(e.target.value);
                  setShowSpecjalizacjaDropdown(true);
                  if (e.target.value === '') {
                    setFormData({ ...formData, nazwa: '', kod: '' });
                  }
                }}
                onFocus={() => setShowSpecjalizacjaDropdown(true)}
                placeholder="Wpisz aby wyszukać..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              {showSpecjalizacjaDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1001,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {slownikSpecjalizacji
                    .filter(s => 
                      s.nazwa.toLowerCase().includes(specjalizacjaSearch.toLowerCase()) ||
                      s.kod.toLowerCase().includes(specjalizacjaSearch.toLowerCase())
                    )
                    .slice(0, 50)
                    .map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setFormData({ ...formData, nazwa: s.nazwa, kod: s.kod });
                          setSpecjalizacjaSearch(`${s.kod} - ${s.nazwa}`);
                          setShowSpecjalizacjaDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          backgroundColor: formData.nazwa === s.nazwa ? '#e3f2fd' : 'white'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = formData.nazwa === s.nazwa ? '#e3f2fd' : 'white')}
                      >
                        <strong>{s.kod}</strong> - {s.nazwa}
                      </div>
                    ))}
                  {slownikSpecjalizacji.filter(s => 
                    s.nazwa.toLowerCase().includes(specjalizacjaSearch.toLowerCase()) ||
                    s.kod.toLowerCase().includes(specjalizacjaSearch.toLowerCase())
                  ).length === 0 && (
                    <div style={{ padding: '8px 12px', color: '#999', fontStyle: 'italic' }}>
                      Brak wyników
                    </div>
                  )}
                </div>
              )}
              {showSpecjalizacjaDropdown && (
                <div
                  onClick={() => setShowSpecjalizacjaDropdown(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000
                  }}
                />
              )}
            </div>

            {/* Stopień specjalizacji - select */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Stopień specjalizacji: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.stopienSpecjalizacji}
                onChange={(e) => setFormData({ ...formData, stopienSpecjalizacji: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- wybierz --</option>
                {STOPNIE_SPECJALIZACJI.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Data uzyskania specjalizacji */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Data uzyskania specjalizacji: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.dataUzyskaniaSpecjalizacji}
                onChange={(e) => setFormData({ ...formData, dataUzyskaniaSpecjalizacji: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Dyplom */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Dyplom:
              </label>
              <input
                type="text"
                value={formData.dyplom}
                onChange={(e) => setFormData({ ...formData, dyplom: e.target.value })}
                placeholder="Wpisz numer dyplomu"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
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
                  cursor: 'pointer'
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
