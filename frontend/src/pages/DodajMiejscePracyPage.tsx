import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface Funkcja {
  id: number;
  kod: string;
  nazwa: string;
}

interface MiejsceSwiadczen {
  id: number;
  kod: string;
  nazwa: string;
  adres: string;
}

interface ZawodSpecjalnosc {
  id: number;
  kod: string;
  nazwa: string;
  stopienSpecjalizacji: string;
}

export default function DodajMiejscePracyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [funkcje, setFunkcje] = useState<Funkcja[]>([]);
  const [miejscaSwiadczen, setMiejscaSwiadczen] = useState<MiejsceSwiadczen[]>([]);
  const [zawodyOsoby, setZawodyOsoby] = useState<ZawodSpecjalnosc[]>([]);
  
  const [formData, setFormData] = useState({
    miejsceSwiadczenId: '',
    kodMiejscaUdzielaniaSwiadczen: '',
    nazwaMiejscaUdzielaniaSwiadczen: '',
    zawodSpecjalnoscId: '',
    kodFunkcji: '',
    nazwaFunkcji: '',
    rodzajZatrudnienia: 'ZATRUDNIONY U MNIE',
    pracaOd: '',
    pracaDo: '',
    bezterminowo: true,
    typHarmonogramu: 'średniogodzinowy'
  });

  useEffect(() => {
    if (id) {
      // Pobierz dane osoby
      api.get(`/api/Osoba/${id}`)
        .then(res => setOsoba(res.data))
        .catch(err => console.error('Błąd podczas pobierania danych osoby:', err));

      // Pobierz zawody/specjalności osoby
      api.get(`/api/ZawodySpecjalnosci/osoba/${id}`)
        .then(res => setZawodyOsoby(res.data))
        .catch(err => console.error('Błąd podczas pobierania zawodów osoby:', err));
    }

    // Pobierz słownik funkcji
    api.get('/api/MiejscePracy/slownik/funkcje')
      .then(res => setFunkcje(res.data))
      .catch(err => console.error('Błąd podczas pobierania słownika funkcji:', err));

    // Pobierz słownik miejsc udzielania świadczeń
    api.get('/api/MiejscePracy/slownik/miejsca')
      .then(res => setMiejscaSwiadczen(res.data))
      .catch(err => console.error('Błąd podczas pobierania słownika miejsc:', err));
  }, [id]);

  const handleFunkcjaChange = (kod: string) => {
    const funkcja = funkcje.find(f => f.kod === kod);
    setFormData({
      ...formData,
      kodFunkcji: kod,
      nazwaFunkcji: funkcja?.nazwa || ''
    });
  };

  const handleMiejsceChange = (miejsceId: string) => {
    const miejsce = miejscaSwiadczen.find(m => m.id === parseInt(miejsceId));
    setFormData({
      ...formData,
      miejsceSwiadczenId: miejsceId,
      kodMiejscaUdzielaniaSwiadczen: miejsce?.kod || '',
      nazwaMiejscaUdzielaniaSwiadczen: miejsce ? `${miejsce.nazwa}, ${miejsce.adres}` : ''
    });
  };

  const handleZawodChange = (zawodId: string) => {
    setFormData({ ...formData, zawodSpecjalnoscId: zawodId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Znajdź wybrany zawód
    const wybranyZawod = zawodyOsoby.find(z => z.id === parseInt(formData.zawodSpecjalnoscId));

    try {
      await api.post('/api/MiejscePracy', {
        osobaId: parseInt(id!),
        kodMiejscaUdzielaniaSwiadczen: formData.kodMiejscaUdzielaniaSwiadczen,
        nazwaMiejscaUdzielaniaSwiadczen: formData.nazwaMiejscaUdzielaniaSwiadczen,
        kodSpecjalnosci: wybranyZawod?.kod || '',
        nazwaSpecjalnosci: wybranyZawod?.nazwa || '',
        zawodSpecjalnosc: wybranyZawod?.nazwa || '',
        kodFunkcji: formData.kodFunkcji,
        nazwaFunkcji: formData.nazwaFunkcji,
        rodzajZatrudnienia: formData.rodzajZatrudnienia,
        pracaOd: formData.pracaOd || null,
        pracaDo: formData.bezterminowo ? null : (formData.pracaDo || null),
        bezterminowo: formData.bezterminowo,
        typHarmonogramu: formData.typHarmonogramu
      });
      showToast('Miejsce pracy zostało dodane', 'success');
      navigate(`/miejsca-pracy/${id}`);
    } catch (error) {
      console.error('Błąd podczas dodawania miejsca pracy:', error);
      showToast('Nie udało się dodać miejsca pracy', 'error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '13px',
    color: '#555',
    fontWeight: '500' as const
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#2c5aa0' }}>Dodawanie miejsca pracy</h2>

      {osoba && (
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ margin: '0.25rem 0' }}>
            <strong>Osoba:</strong> {osoba.imie} {osoba.imie2 ? osoba.imie2 + ' ' : ''}{osoba.nazwisko}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Okres pracy od + Bezterminowo */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ flex: '0 0 200px' }}>
            <label style={labelStyle}>Okres pracy od:*</label>
            <input
              type="date"
              value={formData.pracaOd}
              onChange={(e) => setFormData({ ...formData, pracaOd: e.target.value })}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '8px' }}>
            <input
              type="checkbox"
              id="bezterminowo"
              checked={formData.bezterminowo}
              onChange={(e) => setFormData({ ...formData, bezterminowo: e.target.checked })}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="bezterminowo" style={{ fontSize: '14px' }}>Bezterminowo</label>
          </div>
          {!formData.bezterminowo && (
            <div style={{ flex: '0 0 200px' }}>
              <label style={labelStyle}>Okres pracy do:</label>
              <input
                type="date"
                value={formData.pracaDo}
                onChange={(e) => setFormData({ ...formData, pracaDo: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* Miejsce udzielania świadczeń - dropdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Miejsce udzielania świadczeń:*</label>
          <select
            value={formData.miejsceSwiadczenId}
            onChange={(e) => handleMiejsceChange(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">-- wybierz --</option>
            {miejscaSwiadczen.map(m => (
              <option key={m.id} value={m.id}>
                [{m.kod}] {m.nazwa}, {m.adres}
              </option>
            ))}
          </select>
        </div>

        {/* Zawód/specjalność - wybór z listy zawodów osoby */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Zawód/specjalność:*</label>
          {zawodyOsoby.length === 0 ? (
            <p style={{ color: '#dc3545', fontSize: '14px', margin: '0.5rem 0' }}>
              Osoba nie ma przypisanych zawodów/specjalności. Najpierw dodaj zawód w zakładce "Zawody i specjalności".
            </p>
          ) : (
            <select
              value={formData.zawodSpecjalnoscId}
              onChange={(e) => handleZawodChange(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">-- wybierz --</option>
              {zawodyOsoby.map(z => (
                <option key={z.id} value={z.id}>
                  [{z.kod}] {z.nazwa} {z.stopienSpecjalizacji ? `(${z.stopienSpecjalizacji})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Funkcja */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Funkcja:</label>
          <select
            value={formData.kodFunkcji}
            onChange={(e) => handleFunkcjaChange(e.target.value)}
            style={inputStyle}
          >
            <option value="">-- wybierz --</option>
            {funkcje.map(f => (
              <option key={f.id} value={f.kod}>
                [{f.kod}] {f.nazwa}
              </option>
            ))}
          </select>
        </div>

        {/* Rodzaj zatrudnienia */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Rodzaj zatrudnienia:*</label>
          <select
            value={formData.rodzajZatrudnienia}
            onChange={(e) => setFormData({ ...formData, rodzajZatrudnienia: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="ZATRUDNIONY U MNIE">ZATRUDNIONY U MNIE</option>
            <option value="ZATRUDNIENIE U PODWYKONAWCY/W PODMIOCIE DZIAŁAJĄCYM NA PODST. ART. 132.">
              ZATRUDNIENIE U PODWYKONAWCY/W PODMIOCIE DZIAŁAJĄCYM NA PODST. ART. 132.
            </option>
          </select>
        </div>

        {/* Typ harmonogramu */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Typ harmonogramu:</label>
          <select
            value={formData.typHarmonogramu}
            onChange={(e) => setFormData({ ...formData, typHarmonogramu: e.target.value })}
            style={inputStyle}
          >
            <option value="średniogodzinowy">średniogodzinowy</option>
            <option value="szczegółowy">szczegółowy</option>
          </select>
        </div>

        {/* Przyciski */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(`/miejsca-pracy/${id}`)}
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
            Anuluj
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Zapisz
          </button>
        </div>
      </form>
    </div>
  );
}
