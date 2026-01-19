import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function MiejscaPracyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [miejscaPracy, setMiejscaPracy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pobierz rolę użytkownika
  const userRole = localStorage.getItem('userRole') || 'admin';
  const canEdit = userRole === 'admin';

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

      // Pobierz miejsca pracy
      api.get(`/api/MiejscePracy/osoba/${id}`)
        .then(res => {
          setMiejscaPracy(res.data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania miejsc pracy:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleDelete = async (miejsceId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć to miejsce pracy?')) {
      try {
        await api.delete(`/api/MiejscePracy/${miejsceId}`);
        setMiejscaPracy(miejscaPracy.filter(m => m.id !== miejsceId));
        showToast('Miejsce pracy zostało usunięte', 'success');
      } catch (error) {
        console.error('Błąd podczas usuwania miejsca pracy:', error);
        showToast('Nie udało się usunąć miejsca pracy', 'error');
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Ładowanie...</div>;
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <button 
        onClick={() => navigate('/osoby')}
        style={{
          padding: '8px 16px',
          marginBottom: '1.5rem',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← Powrót do listy osób
      </button>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c5aa0' }}>Informacja o miejscach pracy personelu</h2>
        
        {canEdit && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => navigate(`/dodaj-miejsce-pracy/${id}`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Dodawanie miejsca pracy
            </button>
          </div>
        )}

        {osoba && (
          <div style={{
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: '0.25rem 0' }}><strong>Nazwa:</strong> {osoba.imie} {osoba.imie2 ? osoba.imie2 + ' ' : ''}{osoba.nazwisko}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Typ harmonogramu:</strong> -- wszystkie --</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Deklaracja dostępności w dniu:</strong></p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ marginBottom: '0.5rem', fontSize: '14px', color: '#666' }}>
            Bieżący zakres pozycji: 1 - {miejscaPracy.length}
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#d0e4f7' }}>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Lp.</th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>
                  Miejsce udzielania<br/>świadczeń
                </th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>
                  Specjalność
                </th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>
                  Zawód/specjalność<br/>Funkcja
                </th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ffcccc' }}>
                  Praca od<br/>Praca do
                </th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  Typ<br/>harmonogramu
                </th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  Operacje
                </th>
              </tr>
            </thead>
            <tbody>
              {miejscaPracy.length > 0 ? (
                miejscaPracy.map((miejsce: any, idx: number) => (
                  <tr key={miejsce.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <div><strong>Kod:</strong> {miejsce.kodMiejscaUdzielaniaSwiadczen || '-'}</div>
                      <div><strong>Nazwa:</strong> {miejsce.nazwaMiejscaUdzielaniaSwiadczen || '-'}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>(Kod resoru): --</div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <div><strong>Kod:</strong> {miejsce.kodSpecjalnosci || '-'}</div>
                      <div><strong>Nazwa:</strong> {miejsce.nazwaSpecjalnosci || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <div><strong>Zawód/specjalność:</strong> {miejsce.zawodSpecjalnosc || '-'}</div>
                      <div><strong>Funkcja:</strong> {miejsce.nazwaFunkcji || '--'}</div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#ffe6e6' }}>
                      <div><strong>Od:</strong> {miejsce.pracaOd ? miejsce.pracaOd.split('T')[0] : '-'}</div>
                      <div><strong>Do:</strong> {miejsce.pracaDo ? miejsce.pracaDo.split('T')[0] : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      {miejsce.typHarmonogramu || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {canEdit && (
                          <button
                            onClick={() => navigate(`/edytuj-miejsce-pracy/${miejsce.id}`)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            edytuj
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(miejsce.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            usuń
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/podglad-miejsce-pracy/${miejsce.id}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          podgląd
                        </button>
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          konflikty
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Brak miejsc pracy. Kliknij "Dodawanie miejsca pracy" aby dodać nowe miejsce.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
