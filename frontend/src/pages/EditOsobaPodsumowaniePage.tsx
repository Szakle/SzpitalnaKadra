import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function EditOsobaPodsumowaniePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [wyksztalcenia, setWyksztalcenia] = useState<any[]>([]);
  const [uprawnienia, setUprawnienia] = useState<any[]>([]);
  const [zawody, setZawody] = useState<any[]>([]);
  const [kompetencje, setKompetencje] = useState<any[]>([]);
  const [doswiadczenia, setDoswiadczenia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobierz wszystkie dane
    Promise.all([
      api.get(`/api/Osoba/${id}`),
      api.get(`/api/Wyksztalcenie/osoba/${id}`),
      api.get(`/api/UprawnieniZawodowe/osoba/${id}`),
      api.get(`/api/ZawodySpecjalnosci/osoba/${id}`),
      api.get(`/api/KompetencjeUmiejetnosci/osoba/${id}`),
      api.get(`/api/DoswiadczenieZawodowe/osoba/${id}`)
    ])
      .then(([osobaRes, wyksztalceniaRes, uprawnieniaRes, zawodyRes, kompetencjeRes, doswiadczeniaRes]) => {
        setOsoba(osobaRes.data);
        setWyksztalcenia(wyksztalceniaRes.data);
        setUprawnienia(uprawnieniaRes.data);
        setZawody(zawodyRes.data);
        setKompetencje(kompetencjeRes.data);
        setDoswiadczenia(doswiadczeniaRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania danych:', err);
        setLoading(false);
      });
  }, [id]);

  const handleBack = () => {
    navigate(`/edytuj-osobe-step7/${id}`, { state: location.state });
  };

  const handleSubmit = async () => {
    try {
      // Aktualizuj dane osoby jeśli są zmiany w location.state
      if (location.state) {
        await api.put(`/api/Osoba/${id}`, {
          ...location.state,
          plecId: Number(location.state.plecId || osoba.plecId),
          typPersoneluId: Number(location.state.typPersoneluId || osoba.typPersoneluId),
        });
      }
      showToast('Dane zostały zaktualizowane!', 'success');
      navigate('/osoby');
    } catch (err) {
      console.error('Błąd przy zapisywaniu:', err);
      showToast('Błąd przy zapisywaniu danych.', 'error');
    }
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
        Edycja danych osoby personelu - Podsumowanie
      </h2>

      {/* Osoba personelu */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Osoba personelu
      </div>

      {/* Dane podstawowe */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Dane podstawowe
      </div>

      <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.5rem' }}>
          <div><strong>PESEL:</strong></div>
          <div>{osoba?.pesel || '55010711325'}</div>
          
          <div><strong>Imię:</strong></div>
          <div>{osoba?.imie || 'TEST630730'}</div>
          
          <div><strong>Drugie imię:</strong></div>
          <div>{osoba?.imie2 || '–'}</div>
          
          <div><strong>Nazwisko:</strong></div>
          <div>{osoba?.nazwisko || 'TEST630731'}</div>
          
          <div><strong>Numer telefonu:</strong></div>
          <div>{osoba?.numerTelefonu || '–'}</div>
          
          <div><strong>Adres e-mail:</strong></div>
          <div>–</div>
        </div>
      </div>

      {/* Wykształcenie */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Wykształcenie
      </div>

      {wyksztalcenia.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Rodzaj wykształcenia</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Data ukończenia</th>
            </tr>
          </thead>
          <tbody>
            {wyksztalcenia.map((w, index) => (
              <tr key={w.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{w.rodzajWyksztalcenia || '–'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  {w.dataUkonczenia ? w.dataUkonczenia.split('T')[0] : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', marginBottom: '1rem' }}>Brak danych</div>
      )}

      {/* Uprawnienia zawodowe */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Uprawnienia zawodowe
      </div>

      {uprawnienia.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Rodzaj</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>NPWZ/Id RIZM</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Organ rejestrujący</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Data uzyskania uprawnienia<br/>Data utraty uprawnienia</th>
            </tr>
          </thead>
          <tbody>
            {uprawnienia.map((u, index) => (
              <tr key={u.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.rodzaj || 'LEKARZ'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.npwzIdRizh || '3022214'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontSize: '12px' }}>
                  Kod: 58<br/>Nazwa: Lubelska Izba Lekarska
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  Uzy: {u.dataUzyciaUprawnienia ? u.dataUzyciaUprawnienia.split('T')[0] : '2001-09-26'}<br/>
                  Utr: –
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', marginBottom: '1rem' }}>Brak danych</div>
      )}

      {/* Zawody/specjalności */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Zawody/specjalności
      </div>

      {zawody.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Kod</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Zawód/specjalność</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Stopień specjalizacji</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Data otwarcia<br/>Data uzyskania specjalizacji</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Dyplom</th>
            </tr>
          </thead>
          <tbody>
            {zawody.map((z, index) => (
              <tr key={z.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.kod || '221247'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.nazwa || 'LEKARZ - SPECJALISTA OKULISTYKI'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.stopienSpecjalizacji || 'specjalista'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  Uzy: {z.dataOtwarciaSpecjalizacji ? z.dataOtwarciaSpecjalizacji.split('T')[0] : '1993-04-07'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{z.dyplom || 'brak'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', marginBottom: '1rem' }}>Brak danych</div>
      )}

      {/* Kompetencje i umiejętności */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Kompetencje i umiejętności
      </div>

      {kompetencje.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Kod</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Nazwa</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Poziom</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Zaświadczenie</th>
            </tr>
          </thead>
          <tbody>
            {kompetencje.map((k, index) => (
              <tr key={k.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{k.kod}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{k.nazwa}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{k.poziom}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{k.zaswiadczenie}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', marginBottom: '1rem' }}>Brak danych</div>
      )}

      {/* Doświadczenie zawodowe */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Doświadczenie zawodowe
      </div>

      {doswiadczenia.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Kod</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Nazwa</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Zaświadczenie</th>
            </tr>
          </thead>
          <tbody>
            {doswiadczenia.map((d, index) => (
              <tr key={d.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{d.kod || '0010279'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {d.nazwa || 'DOŚWIADCZENIE ZAWODOWE W PORADNI LUB ODDZIALE SZPITALNYM REALIZUJĄCYM DANY PROGRAM LEKOWY - MIN 2 LATA'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{d.zaswiadczenie || 'brak'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', marginBottom: '1rem' }}>Brak danych</div>
      )}

      {/* Załączniki do wniosku */}
      <div style={{ marginBottom: '0.5rem', backgroundColor: '#b8d4f7', padding: '8px', fontWeight: 'bold' }}>
        <button onClick={() => {}} style={{ color: '#0066cc', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
          zwiń
        </button>
        {' '}Załączniki do wniosku
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', marginBottom: '2rem' }}>Brak danych</div>

      {/* Przyciski */}
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
          onClick={handleSubmit}
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
          Zatwierdź →
        </button>
      </div>
    </div>
  );
}
