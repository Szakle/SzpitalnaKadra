import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function ZatrudnieniePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [zatrudnienie, setZatrudnienie] = useState<any>(null);
  
  // Pobierz rolę użytkownika
  const userRole = localStorage.getItem('userRole') || 'admin';
  const canEdit = userRole === 'admin';
  const [wyksztalcenia, setWyksztalcenia] = useState<any[]>([]);
  const [uprawnienia, setUprawnienia] = useState<any[]>([]);
  const [ograniczenia, setOgraniczenia] = useState<any[]>([]);
  const [zawody, setZawody] = useState<any[]>([]);
  const [kompetencje, setKompetencje] = useState<any[]>([]);
  const [doswiadczenie, setDoswiadczenie] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('wyksztalcenie');

  useEffect(() => {
    if (id) {
      // Pobierz dane osoby
      api.get(`/api/Osoba/${id}`)
        .then(res => {
          console.log('Pobrane dane osoby:', res.data);
          setOsoba(res.data);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania danych osoby:', err);
          setError(true);
        });

      // Pobierz dane zatrudnienia
      api.get(`/api/Zatrudnienie/osoba/${id}`)
        .then(res => {
          console.log('Pobrane dane zatrudnienia:', res.data);
          setZatrudnienie(res.data);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania danych zatrudnienia:', err);
          setZatrudnienie(null);
        });

      // Pobierz wykształcenia
      api.get(`/api/Wyksztalcenie/osoba/${id}`)
        .then(res => {
          console.log('Pobrane wykształcenia:', res.data);
          setWyksztalcenia(res.data || []);
        })
        .catch(err => console.error('Błąd podczas pobierania wykształceń:', err));

      // Pobierz uprawnienia zawodowe
      api.get(`/api/UprawnieniZawodowe/osoba/${id}`)
        .then(res => {
          console.log('Pobrane uprawnienia:', res.data);
          setUprawnienia(res.data || []);
        })
        .catch(err => console.error('Błąd podczas pobierania uprawnień:', err));

      // Pobierz ograniczenia
      api.get(`/api/OgraniczeniaUprawnien/osoba/${id}`)
        .then(res => {
          console.log('Pobrane ograniczenia:', res.data);
          setOgraniczenia(res.data || []);
        })
        .catch(err => console.error('Błąd podczas pobierania ograniczeń:', err));

      // Pobierz zawody/specjalności
      api.get(`/api/ZawodySpecjalnosci/osoba/${id}`)
        .then(res => {
          console.log('Pobrane zawody:', res.data);
          setZawody(res.data || []);
        })
        .catch(err => console.error('Błąd podczas pobierania zawodów:', err));

      // Pobierz kompetencje
      api.get(`/api/KompetencjeUmiejetnosci/osoba/${id}`)
        .then(res => {
          console.log('Pobrane kompetencje:', res.data);
          setKompetencje(res.data || []);
        })
        .catch(err => console.error('Błąd podczas pobierania kompetencji:', err));

      // Pobierz doświadczenie zawodowe
      api.get(`/api/DoswiadczenieZawodowe/osoba/${id}`)
        .then(res => {
          console.log('Pobrane doświadczenie:', res.data);
          setDoswiadczenie(res.data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Błąd podczas pobierania doświadczenia:', err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div style={{ padding: '1rem' }}>Ładowanie...</div>;

  const getPlecLabel = (id?: number) => {
    switch (id) {
      case 1: return 'Kobieta';
      case 2: return 'Mężczyzna';
      case 3: return 'Inne';
      default: return '-';
    }
  };

  const getPersonelLabel = (id?: number) => {
    // 11 typów personelu zgodnych ze słownikiem SZOI
    const personelMap: { [key: number]: string } = {
      2: 'Lekarz',
      17: 'Lekarz dentysta',
      6: 'Felczer',
      4: 'Pielęgniarka',
      3: 'Położna',
      10: 'Diagnosta laboratoryjny',
      7: 'Fizjoterapeuta',
      22: 'Ratownik Medyczny',
      12: 'Farmaceuta',
      30: 'Technik farmaceutyczny',
      8: 'Psycholog',
    };
    return id !== undefined ? (personelMap[id] || 'Inny') : '-';
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const typPersonelu = (() => {
      if (!uprawnienia || uprawnienia.length === 0) return getPersonelLabel(osoba?.typPersoneluId);
      const uprZPwz = uprawnienia.find((u: any) => u.npwzIdRizh);
      return uprZPwz ? uprZPwz.rodzaj : (uprawnienia[0]?.rodzaj || getPersonelLabel(osoba?.typPersoneluId));
    })();

    const nrPwz = (() => {
      if (!uprawnienia || uprawnienia.length === 0) return osoba?.nrPwz || '-';
      const uprZPwz = uprawnienia.find((u: any) => u.npwzIdRizh);
      return uprZPwz ? uprZPwz.npwzIdRizh : (osoba?.nrPwz || '-');
    })();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Zatrudniony personel - ${osoba?.imie} ${osoba?.nazwisko}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #2c5aa0; text-align: center; font-size: 18px; }
          h2 { color: #333; font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .info-box { background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background-color: #e7f3ff; font-weight: bold; }
          .label { font-weight: bold; width: 200px; background-color: #f9f9f9; }
          .section { margin-bottom: 20px; }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <h1>Zatrudniony personel</h1>
        
        <div class="info-box">
          <p><strong>Identyfikator:</strong> ${osoba?.id || '-'}</p>
          <p><strong>Nazwa:</strong> ${osoba?.imie || ''} ${osoba?.imie2 ? osoba.imie2 + ' ' : ''}${osoba?.nazwisko || ''}</p>
        </div>

        <div class="section">
          <h2>Dane podstawowe</h2>
          <table>
            <tr><td class="label">PESEL:</td><td>${osoba?.pesel || '-'}</td></tr>
            <tr><td class="label">Data urodzenia:</td><td>${osoba?.dataUrodzenia ? osoba.dataUrodzenia.split('T')[0] : '-'}</td></tr>
            <tr><td class="label">Imię:</td><td>${osoba?.imie || '-'}</td></tr>
            <tr><td class="label">Drugie imię:</td><td>${osoba?.imie2 || '-'}</td></tr>
            <tr><td class="label">Nazwisko:</td><td>${osoba?.nazwisko || '-'}</td></tr>
            <tr><td class="label">Numer telefonu:</td><td>${osoba?.numerTelefonu || '-'}</td></tr>
            <tr><td class="label">Płeć:</td><td>${getPlecLabel(osoba?.plecId)}</td></tr>
            <tr><td class="label">Typ personelu:</td><td>${typPersonelu}</td></tr>
            <tr><td class="label">Nr PWZ/ Id RIZM:</td><td>${nrPwz}</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Zatrudnienie</h2>
          <table>
            <tr><td class="label">Zatrudnienie/deklaracja zatrudnienia:</td><td>${zatrudnienie?.zatrudnienieDeklaracja || '-'}</td></tr>
            <tr><td class="label">Zatrudniony od:</td><td>${zatrudnienie?.zatrudnionyOd ? zatrudnienie.zatrudnionyOd.split('T')[0] : '-'}</td></tr>
            <tr><td class="label">Zatrudniony do:</td><td>${zatrudnienie?.zatrudnionyDo ? zatrudnienie.zatrudnionyDo.split('T')[0] : '-'}</td></tr>
            <tr><td class="label">Średnioczasowy czas pracy:</td><td>${zatrudnienie?.srednioczasowyCzasPracy || '-'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Wykształcenie</h2>
          <table>
            <tr><th>Rodzaj wykształcenia</th><th>Data ukończenia</th></tr>
            ${wyksztalcenia && wyksztalcenia.length > 0 
              ? wyksztalcenia.map(w => `<tr><td>${w.rodzajWyksztalcenia || '-'}</td><td>${w.dataUkonczenia ? w.dataUkonczenia.split('T')[0] : '-'}</td></tr>`).join('')
              : '<tr><td colspan="2" style="text-align: center; color: #999;">Brak danych</td></tr>'}
          </table>
        </div>

        <div class="section">
          <h2>Uprawnienia zawodowe</h2>
          <table>
            <tr><th>Rodzaj</th><th>NPWZ/Id RIZH</th><th>Organ rejestrujący</th><th>Data użycia uprawnienia</th></tr>
            ${uprawnienia && uprawnienia.length > 0 
              ? uprawnienia.map(u => `<tr><td>${u.rodzaj || '-'}</td><td>${u.npwzIdRizh || '-'}</td><td>${u.organRejestrujacy || '-'}</td><td>${u.dataUzyciaUprawnienia ? u.dataUzyciaUprawnienia.split('T')[0] : '-'}</td></tr>`).join('')
              : '<tr><td colspan="4" style="text-align: center; color: #999;">Brak danych</td></tr>'}
          </table>
        </div>

        <div class="section">
          <h2>Ograniczenia uprawnień zawodowych</h2>
          <table>
            <tr><th>Typ ograniczenia</th><th>Opis</th><th>Od</th><th>Do</th></tr>
            ${ograniczenia && ograniczenia.length > 0 
              ? ograniczenia.map(o => `<tr><td>${o.typOgraniczenia || '-'}</td><td>${o.opis || '-'}</td><td>${o.dataOd ? o.dataOd.split('T')[0] : '-'}</td><td>${o.dataDo ? o.dataDo.split('T')[0] : '-'}</td></tr>`).join('')
              : '<tr><td colspan="4" style="text-align: center; color: #999;">Brak danych</td></tr>'}
          </table>
        </div>

        <div class="section">
          <h2>Zawody/specjalności</h2>
          <table>
            <tr><th>Kod</th><th>Nazwa</th><th>Stopień specjalizacji</th><th>Data otwarcia specjalizacji</th><th>Dyplom</th></tr>
            ${zawody && zawody.length > 0 
              ? zawody.map(z => `<tr><td>${z.kod || '-'}</td><td>${z.nazwa || '-'}</td><td>${z.stopienSpecjalizacji || '-'}</td><td>${z.dataOtwarciaSpecjalizacji ? z.dataOtwarciaSpecjalizacji.split('T')[0] : '-'}</td><td>${z.dyplom || '-'}</td></tr>`).join('')
              : '<tr><td colspan="5" style="text-align: center; color: #999;">Brak danych</td></tr>'}
          </table>
        </div>

        <div class="section">
          <h2>Kompetencje i umiejętności</h2>
          <table>
            <tr><th>Kod</th><th>Nazwa</th><th>Poziom</th><th>Zaświadczenie</th></tr>
            ${kompetencje && kompetencje.length > 0 
              ? kompetencje.map(k => `<tr><td>${k.kod || '-'}</td><td>${k.nazwa || '-'}</td><td>${k.poziom || '-'}</td><td>${k.zaswiadczenie || '-'}</td></tr>`).join('')
              : '<tr><td colspan="4" style="text-align: center; color: #999;">Brak danych</td></tr>'}
          </table>
        </div>

        <div class="section">
          <h2>Doświadczenie zawodowe</h2>
          <table>
            <tr><th>Kod</th><th>Nazwa</th><th>Zaświadczenie</th></tr>
            ${doswiadczenie && doswiadczenie.length > 0 
              ? doswiadczenie.map(d => `<tr><td>${d.kod || '-'}</td><td>${d.nazwa || '-'}</td><td>${d.zaswiadczenie || '-'}</td></tr>`).join('')
              : '<tr><td colspan="3" style="text-align: center; color: #999;">Brak danych</td></tr>'}
          </table>
        </div>

        <p style="text-align: center; color: #666; font-size: 10px; margin-top: 30px;">
          Wygenerowano: ${new Date().toLocaleString('pl-PL')}
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const tabs = [
    { id: 'wyksztalcenie', label: 'Wykształcenie' },
    { id: 'uprawnienia', label: 'Uprawnienia zawodowe' },
    { id: 'ograniczenia', label: 'Ograniczenia upr. zaw.' },
    { id: 'zawody', label: 'Zawody/specjalności' },
    { id: 'kompetencje', label: 'Kompetencje i umiejętności' },
    { id: 'doswiadczenie', label: 'Doświadczenie zawodowe' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wyksztalcenie':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e7f3ff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Rodzaj wykształcenia</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Data ukończenia</th>
              </tr>
            </thead>
            <tbody>
              {wyksztalcenia && wyksztalcenia.length > 0 ? (
                wyksztalcenia.map((w: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{w.rodzajWyksztalcenia || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{w.dataUkonczenia ? w.dataUkonczenia.split('T')[0] : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Brak danych</td>
                </tr>
              )}
            </tbody>
          </table>
        );
      case 'uprawnienia':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e7f3ff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Rodzaj</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>NPWZ/Id RIZH</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Organ rejestrujący</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Data użycia uprawnienia</th>
              </tr>
            </thead>
            <tbody>
              {uprawnienia && uprawnienia.length > 0 ? (
                uprawnienia.map((u: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{u.rodzaj || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{u.npwzIdRizh || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{u.organRejestrujacy || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{u.dataUzyciaUprawnienia ? u.dataUzyciaUprawnienia.split('T')[0] : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Brak danych</td>
                </tr>
              )}
            </tbody>
          </table>
        );
      case 'ograniczenia':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e7f3ff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Typ ograniczenia</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Opis</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Od</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Do</th>
              </tr>
            </thead>
            <tbody>
              {ograniczenia && ograniczenia.length > 0 ? (
                ograniczenia.map((o: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{o.typOgraniczenia || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{o.opis || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{o.dataOd ? o.dataOd.split('T')[0] : '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{o.dataDo ? o.dataDo.split('T')[0] : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Brak danych</td>
                </tr>
              )}
            </tbody>
          </table>
        );
      case 'zawody':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e7f3ff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Kod</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Nazwa</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Stopień specjalizacji</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Data otwarcia specjalizacji</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Dyplom</th>
              </tr>
            </thead>
            <tbody>
              {zawody && zawody.length > 0 ? (
                zawody.map((z: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{z.kod || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{z.nazwa || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{z.stopienSpecjalizacji || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{z.dataOtwarciaSpecjalizacji ? z.dataOtwarciaSpecjalizacji.split('T')[0] : '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{z.dyplom || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Brak danych</td>
                </tr>
              )}
            </tbody>
          </table>
        );
      case 'kompetencje':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e7f3ff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Kod</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Nazwa</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Poziom</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Zaświadczenie</th>
              </tr>
            </thead>
            <tbody>
              {kompetencje && kompetencje.length > 0 ? (
                kompetencje.map((k: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{k.kod || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{k.nazwa || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{k.poziom || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{k.zaswiadczenie || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Brak danych</td>
                </tr>
              )}
            </tbody>
          </table>
        );
      case 'doswiadczenie':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e7f3ff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Kod</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Nazwa</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Zaświadczenie</th>
              </tr>
            </thead>
            <tbody>
              {doswiadczenie && doswiadczenie.length > 0 ? (
                doswiadczenie.map((d: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{d.kod || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{d.nazwa || '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{d.zaswiadczenie || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Brak danych</td>
                </tr>
              )}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/osoby')}
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
          ← Powrót do zatrudnionych personelu
        </button>
        <button 
          onClick={exportToPDF}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📄 Zrób PDF
        </button>
      </div>

      <h2>Zatrudniony personel</h2>
      
      {!error && osoba && (
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p><strong>Identyfikator:</strong> {osoba.id}</p>
          <p><strong>Nazwa:</strong> {osoba.imie} {osoba.imie2 ? osoba.imie2 + ' ' : ''}{osoba.nazwisko}</p>
        </div>
      )}

      <h3>Dane podstawowe</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold', width: '200px' }}>PESEL:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{osoba?.pesel || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Data urodzenia:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{osoba?.dataUrodzenia ? osoba.dataUrodzenia.split('T')[0] : '-'}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Imię:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{osoba?.imie || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Drugie imię:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{osoba?.imie2 || '-'}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Nazwisko:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{osoba?.nazwisko || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Numer telefonu:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{osoba?.numerTelefonu || '-'}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Płeć:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{getPlecLabel(osoba?.plecId)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Typ personelu:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{(() => {
              if (!uprawnienia || uprawnienia.length === 0) return getPersonelLabel(osoba?.typPersoneluId);
              const uprZPwz = uprawnienia.find((u: any) => u.npwzIdRizh);
              return uprZPwz ? uprZPwz.rodzaj : (uprawnienia[0].rodzaj || getPersonelLabel(osoba?.typPersoneluId));
            })()}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', fontWeight: 'bold' }}>Nr PWZ:</td>
            <td style={{ padding: '8px' }}>{(() => {
              if (!uprawnienia || uprawnienia.length === 0) return osoba?.nrPwz || '-';
              const uprZPwz = uprawnienia.find((u: any) => u.npwzIdRizh);
              return uprZPwz ? uprZPwz.npwzIdRizh : (osoba?.nrPwz || '-');
            })()}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
        <h3 style={{ margin: 0 }}>Zatrudnienie</h3>
        {canEdit && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate(`/edytuj-zatrudnienie/${id}`)}
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
              Edytuj zatrudnienie
            </button>
            <button
              onClick={async () => {
                if (!zatrudnienie) {
                  showToast('Brak zatrudnienia do usunięcia', 'warning');
                  return;
                }
                if (window.confirm('Czy na pewno chcesz usunąć to zatrudnienie?')) {
                  try {
                    await api.delete(`/api/Zatrudnienie/${zatrudnienie.id}`);
                    showToast('Zatrudnienie zostało usunięte', 'success');
                    navigate('/osoby');
                  } catch (err) {
                    console.error('Błąd podczas usuwania zatrudnienia:', err);
                    showToast('Nie udało się usunąć zatrudnienia', 'error');
                  }
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Usuń zatrudnienie
            </button>
          </div>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <tbody>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold', width: '200px' }}>Zatrudnienie/deklaracja zatrudnienia:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{zatrudnienie?.zatrudnienieDeklaracja || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Zatrudniony od:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{zatrudnienie?.zatrudnionyOd ? zatrudnienie.zatrudnionyOd.split('T')[0] : '-'}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Zatrudniony do:</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{zatrudnienie?.zatrudnionyDo ? zatrudnienie.zatrudnionyDo.split('T')[0] : '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', fontWeight: 'bold' }}>Średnioczasowy czas pracy godziny/minuty:</td>
            <td style={{ padding: '8px' }}>{zatrudnienie?.srednioczasowyCzasPracy || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Tab Navigation */}
      <div style={{ marginTop: '2rem', borderBottom: '2px solid #ddd', display: 'flex', gap: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#f0f0f0',
              color: activeTab === tab.id ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #0056b3' : 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderRadius: '4px 4px 0 0',
              marginRight: '2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.5rem 0', borderTop: '1px solid #ddd' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
