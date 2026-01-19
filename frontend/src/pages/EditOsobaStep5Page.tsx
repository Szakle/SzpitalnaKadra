import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface SlownikKompetencji {
  id: number;
  kod: string;
  nazwa: string;
  opis: string;
}

export default function EditOsobaStep5Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [kompetencje, setKompetencje] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    kod: '',
    nazwa: '',
    poziom: '',
    zaswiadczenie: ''
  });
  
  // Słownik kompetencji
  const [slownikKompetencji, setSlownikKompetencji] = useState<SlownikKompetencji[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedKompetencja, setSelectedKompetencja] = useState<SlownikKompetencji | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadKompetencje = () => {
    api.get(`/api/KompetencjeUmiejetnosci/osoba/${id}`)
      .then(res => {
        setKompetencje(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania kompetencji:', err);
        setLoading(false);
      });
  };

  const loadSlownikKompetencji = async () => {
    try {
      const res = await api.get('/api/KompetencjeUmiejetnosci/slownik');
      setSlownikKompetencji(res.data);
    } catch (err) {
      console.error('Błąd podczas pobierania słownika kompetencji:', err);
    }
  };

  useEffect(() => {
    loadKompetencje();
    loadSlownikKompetencji();
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

  const filteredKompetencje = slownikKompetencji.filter(k =>
    k.nazwa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBack = () => {
    navigate(`/edytuj-osobe-step4/${id}`, { state: location.state });
  };

  const handleNext = () => {
    navigate(`/edytuj-osobe-step6/${id}`, { state: location.state });
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      kod: '',
      nazwa: '',
      poziom: '',
      zaswiadczenie: ''
    });
    setSelectedKompetencja(null);
    setSearchTerm('');
    setShowModal(true);
  };

  const handleEdit = (kompetencja: any) => {
    setEditingId(kompetencja.id);
    setFormData({
      kod: kompetencja.kod || '',
      nazwa: kompetencja.nazwa || '',
      poziom: kompetencja.poziom || '',
      zaswiadczenie: kompetencja.zaswiadczenie || ''
    });
    // Znajdź odpowiadającą pozycję ze słownika
    const found = slownikKompetencji.find(k => k.kod === kompetencja.kod);
    setSelectedKompetencja(found || null);
    setSearchTerm(found ? `${found.kod} - ${found.nazwa}` : '');
    setShowModal(true);
  };

  const handleSelectKompetencja = (k: SlownikKompetencji) => {
    setSelectedKompetencja(k);
    setFormData({
      ...formData,
      kod: k.kod,
      nazwa: k.nazwa
    });
    setSearchTerm(`${k.kod} - ${k.nazwa}`);
    setShowDropdown(false);
  };

  const handleDelete = async (kompId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę kompetencję/umiejętność?')) {
      return;
    }

    try {
      await api.delete(`/api/KompetencjeUmiejetnosci/${kompId}`);
      loadKompetencje();
      showToast('Kompetencja/umiejętność została usunięta', 'success');
    } catch (err) {
      console.error('Błąd podczas usuwania:', err);
      showToast('Błąd podczas usuwania kompetencji/umiejętności', 'error');
    }
  };

  const handleModalSubmit = async () => {
    if (!formData.kod || !formData.nazwa) {
      showToast('Wybierz kompetencję/umiejętność ze słownika', 'warning');
      return;
    }

    try {
      const payload = {
        ...formData,
        osobaId: Number(id)
      };

      console.log('Wysyłane dane do API:', payload);

      if (editingId) {
        const response = await api.put(`/api/KompetencjeUmiejetnosci/${editingId}`, payload);
        console.log('Odpowiedź PUT:', response.data);
        showToast('Kompetencja/umiejętność została zaktualizowana', 'success');
      } else {
        const response = await api.post('/api/KompetencjeUmiejetnosci', payload);
        console.log('Odpowiedź POST:', response.data);
        showToast('Kompetencja/umiejętność została dodana', 'success');
      }

      setShowModal(false);
      loadKompetencje();
    } catch (err: any) {
      console.error('Błąd podczas zapisywania:', err);
      showToast(`Błąd podczas zapisywania danych: ${err.response?.data?.error || err.message}`, 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#0044cc', marginBottom: '1.5rem' }}>
        Edycja danych osoby personelu - Kompetencje i umiejętności
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

      {kompetencje.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#b8d4f7' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', width: '50px' }}>Lp.</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Kod</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Nazwa</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Poziom</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Zaświadczenie</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Operacje</th>
            </tr>
          </thead>
          <tbody>
            {kompetencje.map((k, index) => (
              <tr key={k.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{k.kod}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{k.nazwa}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{k.poziom}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{k.zaswiadczenie}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(k)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>edycja</button>
                  <br />
                  <button onClick={() => handleDelete(k.id)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>usuń</button>
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
              {editingId ? 'Edytuj kompetencję/umiejętność' : 'Dodaj kompetencję/umiejętność'}
            </h3>

            {/* Wyszukiwarka kompetencji */}
            <div style={{ marginBottom: '1rem' }} ref={dropdownRef}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Kompetencja/umiejętność: <span style={{ color: 'red' }}>*</span>
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
                  placeholder="Wpisz kod lub nazwę kompetencji..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                {showDropdown && filteredKompetencje.length > 0 && (
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
                    {filteredKompetencje.slice(0, 50).map((k) => (
                      <div
                        key={k.id}
                        onClick={() => handleSelectKompetencja(k)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px',
                          backgroundColor: selectedKompetencja?.id === k.id ? '#e3f2fd' : 'white'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedKompetencja?.id === k.id ? '#e3f2fd' : 'white')}
                      >
                        <strong>{k.kod}</strong> - {k.nazwa}
                      </div>
                    ))}
                    {filteredKompetencje.length > 50 && (
                      <div style={{ padding: '8px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        ... i {filteredKompetencje.length - 50} więcej. Zawęź wyszukiwanie.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedKompetencja && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>Wybrano:</strong> {selectedKompetencja.kod} - {selectedKompetencja.nazwa}
                </div>
              )}
            </div>

            {/* Poziom */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Poziom:
              </label>
              <select
                value={formData.poziom}
                onChange={(e) => setFormData({ ...formData, poziom: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- wybierz --</option>
                <option value="podstawowy">Podstawowy</option>
                <option value="średniozaawansowany">Średniozaawansowany</option>
                <option value="zaawansowany">Zaawansowany</option>
                <option value="ekspert">Ekspert</option>
              </select>
            </div>

            {/* Zaświadczenie */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Zaświadczenie/certyfikat:
              </label>
              <input
                type="text"
                value={formData.zaswiadczenie}
                onChange={(e) => setFormData({ ...formData, zaswiadczenie: e.target.value })}
                placeholder="Numer lub nazwa zaświadczenia/certyfikatu"
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
