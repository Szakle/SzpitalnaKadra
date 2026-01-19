import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface MiejscePracy {
  id: number;
  osobaId: number;
  kodMiejscaUdzielaniaSwiadczen: string;
  nazwaMiejscaUdzielaniaSwiadczen: string;
  kodSpecjalnosci: string;
  nazwaSpecjalnosci: string;
  zawodSpecjalnosc: string;
  kodFunkcji: string;
  nazwaFunkcji: string;
  rodzajZatrudnienia: string;
  pracaOd: string;
  pracaDo: string;
  bezterminowo: boolean;
  typHarmonogramu: string;
  createdAt: string;
  updatedAt: string;
}

interface Osoba {
  id: number;
  pesel: string;
  imie: string;
  imie2: string;
  nazwisko: string;
}

export default function PodgladMiejscaPracyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [miejsce, setMiejsce] = useState<MiejscePracy | null>(null);
  const [osoba, setOsoba] = useState<Osoba | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/api/MiejscePracy/${id}`)
        .then(res => {
          setMiejsce(res.data);
          return api.get(`/api/Osoba/${res.data.osobaId}`);
        })
        .then(res => {
          setOsoba(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania danych:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL');
  };

  const labelStyle: React.CSSProperties = {
    color: '#666',
    fontSize: '13px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    width: '250px',
    textAlign: 'left',
    verticalAlign: 'top'
  };

  const valueStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #ddd',
    fontSize: '14px'
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Ładowanie...</div>;
  }

  if (!miejsce || !osoba) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Nie znaleziono danych</div>;
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#2c5aa0', textAlign: 'center' }}>
        Miejsce pracy zatrudnionego personelu
      </h2>

      {/* Sekcja: Osoba personelu */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ 
              backgroundColor: '#5b9bd5', 
              color: 'white', 
              padding: '10px', 
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Osoba personelu
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={labelStyle}>PESEL</td>
            <td style={valueStyle}>{osoba.pesel}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Imię</td>
            <td style={valueStyle}>{osoba.imie}</td>
          </tr>
          {osoba.imie2 && (
            <tr>
              <td style={labelStyle}>Drugie imię</td>
              <td style={valueStyle}>{osoba.imie2}</td>
            </tr>
          )}
          <tr>
            <td style={labelStyle}>Nazwisko</td>
            <td style={valueStyle}>{osoba.nazwisko}</td>
          </tr>
        </tbody>
      </table>

      {/* Sekcja: Miejsce pracy personelu */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ 
              backgroundColor: '#5b9bd5', 
              color: 'white', 
              padding: '10px', 
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Miejsce pracy personelu
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={labelStyle}>Miejsce udzielania świadczeń</td>
            <td style={valueStyle}>
              {miejsce.kodMiejscaUdzielaniaSwiadczen && (
                <div><strong>Kod:</strong> {miejsce.kodMiejscaUdzielaniaSwiadczen}</div>
              )}
              {miejsce.nazwaMiejscaUdzielaniaSwiadczen && (
                <div><strong>Nazwa:</strong> {miejsce.nazwaMiejscaUdzielaniaSwiadczen}</div>
              )}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Zawód/specjalność</td>
            <td style={valueStyle}>
              {miejsce.kodSpecjalnosci && `${miejsce.kodSpecjalnosci} `}
              {miejsce.zawodSpecjalnosc || miejsce.nazwaSpecjalnosci || '-'}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Funkcja</td>
            <td style={valueStyle}>
              {miejsce.kodFunkcji || miejsce.nazwaFunkcji ? 
                `${miejsce.kodFunkcji ? `[${miejsce.kodFunkcji}] ` : ''}${miejsce.nazwaFunkcji || ''}` 
                : '-'}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Rodzaj zatrudnienia</td>
            <td style={valueStyle}>{miejsce.rodzajZatrudnienia || '-'}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Okres pracy od</td>
            <td style={valueStyle}>{formatDate(miejsce.pracaOd)}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Okres pracy do</td>
            <td style={valueStyle}>
              {miejsce.bezterminowo ? 'Bezterminowo' : formatDate(miejsce.pracaDo)}
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Typ harmonogramu</td>
            <td style={valueStyle}>{miejsce.typHarmonogramu || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Przyciski */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => navigate(`/miejsca-pracy/${osoba.id}`)}
          style={{
            padding: '10px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Powrót do listy
        </button>
        <button
          onClick={() => navigate(`/edytuj-miejsce-pracy/${miejsce.id}`)}
          style={{
            padding: '10px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Edytuj
        </button>
      </div>
    </div>
  );
}
