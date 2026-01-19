import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function EditOsobaStep2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [wyksztalcenia, setWyksztalcenia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    rodzajWyksztalcenia: '',
    dataUkonczenia: ''
  });
  
  // Słownik rodzajów wykształcenia ze SZOI
  const [slownikRodzaje, setSlownikRodzaje] = useState<{id: number, kod: string, nazwa: string}[]>([]);

  const loadWyksztalcenia = () => {
    api.get(`/api/Wyksztalcenie/osoba/${id}`)
      .then(res => {
        setWyksztalcenia(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania wykształcenia:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWyksztalcenia();
    loadSlownikRodzaje();
  }, [id]);

  const loadSlownikRodzaje = async () => {
    try {
      const res = await api.get('/api/Wyksztalcenie/slownik/rodzaj');
      setSlownikRodzaje(res.data);
    } catch (err) {
      console.error('Błąd podczas pobierania słownika rodzajów wykształcenia:', err);
    }
  };

  const handleBack = () => {
    navigate(`/edytuj-osobe/${id}`, { state: location.state });
  };

  const handleNext = () => {
    navigate(`/edytuj-osobe-step3/${id}`, { state: location.state });
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      rodzajWyksztalcenia: '',
      dataUkonczenia: ''
    });
    setShowModal(true);
  };

  const handleEdit = (wyksztalcenie: any) => {
    setEditingId(wyksztalcenie.id);
    setFormData({
      rodzajWyksztalcenia: wyksztalcenie.rodzajWyksztalcenia || '',
      dataUkonczenia: wyksztalcenie.dataUkonczenia ? wyksztalcenie.dataUkonczenia.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (wyksztalcenieId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to wykształcenie?')) {
      return;
    }

    try {
      await api.delete(`/api/Wyksztalcenie/${wyksztalcenieId}`);
      loadWyksztalcenia();
      showToast('Wykształcenie zostało usunięte', 'success');
    } catch (err) {
      console.error('Błąd podczas usuwania:', err);
      showToast('Błąd podczas usuwania wykształcenia', 'error');
    }
  };

  const handleModalSubmit = async () => {
    if (!formData.rodzajWyksztalcenia) {
      showToast('Rodzaj wykształcenia jest wymagany', 'warning');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        osobaId: Number(id)
      };

      if (editingId) {
        await api.put(`/api/Wyksztalcenie/${editingId}`, payload);
        showToast('Wykształcenie zostało zaktualizowane', 'success');
      } else {
        await api.post('/api/Wyksztalcenie', payload);
        showToast('Wykształcenie zostało dodane', 'success');
      }

      setShowModal(false);
      loadWyksztalcenia();
    } catch (err) {
      console.error('Błąd podczas zapisywania:', err);
      showToast('Błąd podczas zapisywania danych', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#0044cc', marginBottom: '1.5rem' }}>
        Edycja danych osoby personelu - Wykształcenie
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

      {wyksztalcenia.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#b8d4f7' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Lp.</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Wykształcenie</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Data ukończenia</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>Operacje</th>
            </tr>
          </thead>
          <tbody>
            {wyksztalcenia.map((w, index) => (
              <tr key={w.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{w.rodzajWyksztalcenia || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  {w.dataUkonczenia ? new Date(w.dataUkonczenia).toLocaleDateString('pl-PL') : '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(w)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', marginRight: '10px' }}>edytuj</button>
                  <button onClick={() => handleDelete(w.id)} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>usuń</button>
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

      {/* Modal do dodawania/edycji wykształcenia */}
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
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edytuj wykształcenie' : 'Dodaj wykształcenie'}</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rodzaj wykształcenia: <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.rodzajWyksztalcenia}
                onChange={(e) => setFormData({ ...formData, rodzajWyksztalcenia: e.target.value })}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                required
              >
                <option value="">-- Wybierz rodzaj wykształcenia --</option>
                {slownikRodzaje.map((r) => (
                  <option key={r.id} value={r.nazwa}>{r.kod} - {r.nazwa}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Data ukończenia: <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                value={formData.dataUkonczenia}
                onChange={(e) => setFormData({ ...formData, dataUkonczenia: e.target.value })}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
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
