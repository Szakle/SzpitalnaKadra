import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function RozwiazZatrudnieniePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [form, setForm] = useState({
    dataRozwiazania: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/Osoba/${id}`)
      .then(res => {
        setOsoba(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania danych osoby:', err);
        showToast('Nie można pobrać danych osoby', 'error');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.dataRozwiazania) {
      showToast('Proszę podać datę rozwiązania umowy', 'warning');
      return;
    }

    try {
      // Tutaj można dodać endpoint do zapisania daty rozwiązania
      // Na razie tylko informacja
      showToast(`Rozwiązano zatrudnienie z datą: ${form.dataRozwiazania}`, 'success');
      navigate(`/zatrudnienie/${id}`);
    } catch (err) {
      console.error('Błąd przy rozwiązywaniu zatrudnienia:', err);
      showToast('Błąd przy rozwiązywaniu zatrudnienia.', 'error');
    }
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#0066cc', marginBottom: '0.5rem' }}>
        (1) Rozwiązanie umowy o zatrudnienie osoby personelu
      </h2>
      
      {osoba && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0.25rem 0' }}><strong>Imię:</strong> {osoba.imie}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Nazwisko:</strong> {osoba.nazwisko}</p>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Data rozwiązania umowy:*
        </label>
        <input
          type="date"
          name="dataRozwiazania"
          value={form.dataRozwiazania}
          onChange={handleChange}
          style={{ padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <p style={{ fontSize: '14px', color: '#666', marginTop: '1.5rem' }}>* pola wymagane</p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={handleCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Anuluj
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Rozwiąż zatrudnienie
        </button>
      </div>
    </div>
  );
}
