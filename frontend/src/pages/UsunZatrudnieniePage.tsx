import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function UsunZatrudnieniePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [zatrudnienie, setZatrudnienie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Pobierz dane osoby
      api.get(`/api/Osoba/${id}`)
        .then(res => {
          setOsoba(res.data);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania danych osoby:', err);
        });

      // Pobierz dane zatrudnienia
      api.get(`/api/Zatrudnienie/osoba/${id}`)
        .then(res => {
          setZatrudnienie(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania danych zatrudnienia:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleDelete = async () => {
    if (!zatrudnienie) {
      showToast('Brak zatrudnienia do usunięcia', 'warning');
      return;
    }

    if (window.confirm(`Czy na pewno chcesz usunąć zatrudnienie dla ${osoba?.imie} ${osoba?.nazwisko}?`)) {
      try {
        await api.delete(`/api/Zatrudnienie/${zatrudnienie.id}`);
        showToast('Zatrudnienie zostało usunięte pomyślnie', 'success');
        navigate('/osoby');
      } catch (error) {
        console.error('Błąd podczas usuwania zatrudnienia:', error);
        showToast('Nie udało się usunąć zatrudnienia', 'error');
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Ładowanie...</div>;
  }

  if (!zatrudnienie) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Usuń zatrudnienie</h2>
        <div style={{
          padding: '2rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginTop: '1rem'
        }}>
          Brak zatrudnienia dla tej osoby
        </div>
        <button
          onClick={() => navigate('/osoby')}
          style={{
            marginTop: '1rem',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Powrót do listy
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#dc3545' }}>Usuń zatrudnienie</h2>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#856404'
        }}>
          <strong>⚠️ Uwaga:</strong> Ta operacja jest nieodwracalna. Wszystkie dane zatrudnienia zostaną trwale usunięte.
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#495057', marginBottom: '1rem' }}>Informacje o osobie</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', fontSize: '14px' }}>
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Imię i nazwisko:</span>
            <span>{osoba?.imie} {osoba?.imie2 ? osoba.imie2 + ' ' : ''}{osoba?.nazwisko}</span>
            
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>PESEL:</span>
            <span>{osoba?.pesel || '-'}</span>
            
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Nr PWZ:</span>
            <span>{osoba?.nrPwz || '-'}</span>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#495057', marginBottom: '1rem' }}>Szczegóły zatrudnienia do usunięcia</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.5rem', fontSize: '14px' }}>
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Zatrudnienie/deklaracja:</span>
            <span>{zatrudnienie.zatrudnienieDeklaracja || '-'}</span>
            
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Zatrudniony od:</span>
            <span>{zatrudnienie.zatrudnionyOd ? zatrudnienie.zatrudnionyOd.split('T')[0] : '-'}</span>
            
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Zatrudniony do:</span>
            <span>{zatrudnienie.zatrudnionyDo ? zatrudnienie.zatrudnionyDo.split('T')[0] : '-'}</span>
            
            <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Czas pracy:</span>
            <span>{zatrudnienie.srednioczasowyCzasPracy || '-'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            onClick={() => navigate('/osoby')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Anuluj
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
          >
            Usuń zatrudnienie
          </button>
        </div>
      </div>
    </div>
  );
}
