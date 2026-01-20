import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { runScraper, getReportsHistory, getReportById, ImportReport, ImportReportSummary, getSzoiSettings, saveSzoiSettings, SzoiSettings } from '../services/api';
import { useToast } from './Toast';

interface NavbarProps {
  onLogout: () => void;
}

const personelMap: { [key: number]: string } = {
  0: '-', 1: 'Inny', 2: 'Lekarz', 3: 'Położna', 4: 'Pielęgniarka',
  6: 'Felczer', 7: 'Rehabilitant', 8: 'Psycholog', 17: 'Lekarz dentysta', 22: 'Ratownik Medyczny'
};

const Navbar = ({ onLogout }: NavbarProps) => {
  const [scraperLoading, setScraperLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentReport, setCurrentReport] = useState<ImportReport | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ImportReportSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { showToast } = useToast();
  
  // SZOI Settings
  const [showSzoiSettings, setShowSzoiSettings] = useState(false);
  const [szoiSettings, setSzoiSettings] = useState<SzoiSettings>({
    szoiUrl: 'https://szoi-test.nfz-lublin.pl',
    recordLimit: 20,
    fetchAll: false,
    szoiLogin: '',
    szoiPassword: ''
  });
  const [szoiLoading, setSzoiLoading] = useState(false);
  
  // App version - auto-generated during Docker build
  const APP_VERSION = process.env.REACT_APP_BUILD_VERSION || 'dev';
  
  // Pobierz rolę użytkownika
  const userRole = localStorage.getItem('userRole') || 'admin';
  const isAdmin = userRole === 'admin';
  const canRead = userRole === 'admin' || userRole === 'reader';
  const canWrite = userRole === 'admin' || userRole === 'writer';

  // Załaduj ustawienia SZOI przy otwarciu modala
  useEffect(() => {
    if (showSzoiSettings) {
      loadSzoiSettings();
    }
  }, [showSzoiSettings]);

  const loadSzoiSettings = async () => {
    try {
      const settings = await getSzoiSettings();
      setSzoiSettings(settings);
    } catch (error) {
      console.error('Error loading SZOI settings:', error);
    }
  };

  const handleSaveSzoiSettings = async () => {
    setSzoiLoading(true);
    try {
      await saveSzoiSettings(szoiSettings);
      showToast('Ustawienia SZOI zostały zapisane.', 'success');
      setShowSzoiSettings(false);
    } catch (error) {
      console.error('Error saving SZOI settings:', error);
      showToast('Nie udało się zapisać ustawień.', 'error');
    } finally {
      setSzoiLoading(false);
    }
  };

  const handleRunScraper = async () => {
    if (!window.confirm("Czy na pewno chcesz pobrać dane z SZOI? Proces może zająć kilka minut.")) return;
    
    setScraperLoading(true);
    try {
      const result = await runScraper();
      setCurrentReport(result);
      setShowReport(true);
    } catch (error) {
      console.error("Scraper error:", error);
      showToast("Wystąpił błąd podczas pobierania danych z SZOI.", 'error');
    } finally {
      setScraperLoading(false);
    }
  };

  const handleShowHistory = async () => {
    setHistoryLoading(true);
    try {
      const reports = await getReportsHistory();
      setHistory(reports);
      setShowHistory(true);
    } catch (error) {
      console.error("Error loading history:", error);
      showToast("Nie udało się załadować historii importów.", 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewReport = async (id: string) => {
    try {
      const report = await getReportById(id);
      setCurrentReport(report);
      setShowHistory(false);
      setShowReport(true);
    } catch (error) {
      console.error("Error loading report:", error);
      showToast("Nie udało się załadować raportu.", 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL');
  };

  return (
    <>
      <nav style={{ 
        padding: '0.75rem 1.5rem', 
        background: '#eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {canWrite && (
            <Link 
              to="/dodaj-osobe" 
              style={{ 
                padding: '10px 18px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Dodaj Osobę
            </Link>
          )}
          {canRead && (
            <Link 
              to="/osoby" 
              style={{ 
                padding: '10px 18px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Lista Osób
            </Link>
          )}
          {userRole === 'admin' && (
            <>
              <Link 
                to="/uzytkownicy" 
                style={{ 
                  padding: '10px 18px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Użytkownicy
              </Link>
              <button 
                onClick={handleRunScraper} 
                disabled={scraperLoading}
                style={{ 
                  padding: '10px 18px',
                  backgroundColor: scraperLoading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: scraperLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {scraperLoading ? 'Pobieranie...' : 'Pobierz z SZOI'}
              </button>
              <button 
                onClick={handleShowHistory} 
                disabled={historyLoading}
                style={{ 
                  padding: '10px 18px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {historyLoading ? 'Ładowanie...' : 'Historia importów'}
              </button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/ustawienia-2fa"
            style={{
              padding: '10px 18px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            2FA
          </Link>
          {isAdmin && (
            <button
              onClick={() => setShowSzoiSettings(true)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ⚙️ SZOI
            </button>
          )}
          <button
            onClick={onLogout}
            style={{
              padding: '10px 18px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Wyloguj
          </button>
          <span 
            title={`Wersja: ${APP_VERSION}`}
            style={{
              fontSize: '14px',
              color: '#6c757d',
              marginLeft: '8px',
              cursor: 'help',
              alignSelf: 'center'
            }}
          >
            ⓘ
          </span>
        </div>
      </nav>

      {/* Modal raportu */}
      {showReport && currentReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '2rem',
            maxWidth: '800px', maxHeight: '80vh', overflow: 'auto', width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Raport importu z SZOI</h2>
              <button onClick={() => setShowReport(false)} style={{
                background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'
              }}>×</button>
            </div>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <p><strong>Data:</strong> {formatDate(currentReport.timestamp)}</p>
              <p><strong>Przetworzono:</strong> {currentReport.totalProcessed} rekordów</p>
              <p style={{ color: '#28a745' }}><strong>Dodano:</strong> {currentReport.addedCount}</p>
              <p style={{ color: '#ffc107' }}><strong>Zaktualizowano:</strong> {currentReport.updatedCount}</p>
              {currentReport.errorCount > 0 && (
                <p style={{ color: '#dc3545' }}><strong>Błędy:</strong> {currentReport.errorCount}</p>
              )}
            </div>

            {currentReport.addedPersons.length > 0 && (
              <>
                <h3 style={{ color: '#28a745' }}>Nowe osoby ({currentReport.addedCount})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#d4edda' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Imię i nazwisko</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>PESEL</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Nr PWZ</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Typ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReport.addedPersons.map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.id}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.imie} {p.nazwisko}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.pesel}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.nrPwz || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{personelMap[p.typPersoneluId] || 'Inny'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {currentReport.updatedPersons.length > 0 && (
              <>
                <h3 style={{ color: '#856404' }}>Zaktualizowane osoby ({currentReport.updatedCount})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fff3cd' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Imię i nazwisko</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>PESEL</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Nr PWZ</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Typ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReport.updatedPersons.map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.id}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.imie} {p.nazwisko}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.pesel}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.nrPwz || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{personelMap[p.typPersoneluId] || 'Inny'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {currentReport.errorPersons && currentReport.errorPersons.length > 0 && (
              <>
                <h3 style={{ color: '#dc3545' }}>Błędy importu ({currentReport.errorCount})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8d7da' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Imię i nazwisko</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>PESEL</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Błąd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReport.errorPersons.map((e, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.imie} {e.nazwisko}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.pesel}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#dc3545', fontSize: '12px' }}>{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button onClick={() => { setShowReport(false); window.location.reload(); }} style={{
                padding: '10px 20px', backgroundColor: '#007bff', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}>Zamknij i odśwież</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historii */}
      {showHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '2rem',
            maxWidth: '700px', maxHeight: '80vh', overflow: 'auto', width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Historia importów z SZOI</h2>
              <button onClick={() => setShowHistory(false)} style={{
                background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'
              }}>×</button>
            </div>

            {history.length === 0 ? (
              <p>Brak zapisanych raportów.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Data</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Przetw.</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Dodane</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Zaktual.</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(r.timestamp)}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{r.totalProcessed}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', color: '#28a745' }}>{r.addedCount}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', color: '#ffc107' }}>{r.updatedCount}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <button onClick={() => handleViewReport(r.id)} style={{
                          padding: '4px 12px', backgroundColor: '#007bff', color: 'white',
                          border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                        }}>Zobacz</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button onClick={() => setShowHistory(false)} style={{
                padding: '10px 20px', backgroundColor: '#6c757d', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}>Zamknij</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ustawień SZOI */}
      {showSzoiSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '2rem',
            maxWidth: '500px', width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>⚙️ Ustawienia SZOI</h2>
              <button onClick={() => setShowSzoiSettings(false)} style={{
                background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'
              }}>×</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Adres URL SZOI:
              </label>
              <input
                type="text"
                value={szoiSettings.szoiUrl}
                onChange={(e) => setSzoiSettings({ ...szoiSettings, szoiUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="https://szoi-test.nfz-lublin.pl"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Login SZOI:
              </label>
              <input
                type="text"
                value={szoiSettings.szoiLogin || ''}
                onChange={(e) => setSzoiSettings({ ...szoiSettings, szoiLogin: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Wpisz login do SZOI"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Hasło SZOI:
              </label>
              <input
                type="password"
                value={szoiSettings.szoiPassword === '********' ? '' : (szoiSettings.szoiPassword || '')}
                onChange={(e) => setSzoiSettings({ ...szoiSettings, szoiPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder={szoiSettings.szoiPassword === '********' ? '••••••••' : 'Wpisz hasło do SZOI'}
              />
              {szoiSettings.szoiPassword === '********' && (
                <small style={{ color: '#666', fontSize: '12px' }}>Hasło jest już ustawione. Zostaw puste aby nie zmieniać.</small>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={szoiSettings.fetchAll}
                  onChange={(e) => setSzoiSettings({ ...szoiSettings, fetchAll: e.target.checked, recordLimit: e.target.checked ? null : 20 })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 'bold' }}>Pobierz wszystkie rekordy</span>
              </label>
            </div>

            {!szoiSettings.fetchAll && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Limit rekordów do pobrania:
                </label>
                <input
                  type="number"
                  value={szoiSettings.recordLimit || ''}
                  onChange={(e) => setSzoiSettings({ ...szoiSettings, recordLimit: e.target.value ? parseInt(e.target.value) : null })}
                  min="1"
                  max="1000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="20"
                />
              </div>
            )}

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px', 
              marginBottom: '1.5rem',
              fontSize: '13px',
              color: '#666'
            }}>
              <strong>💡 Wskazówka:</strong> Przy dużej liczbie rekordów pobieranie może trwać kilka minut. 
              Zalecamy testowanie z limitem 20-50 rekordów.
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSzoiSettings(false)}
                style={{
                  padding: '10px 20px',
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
                onClick={handleSaveSzoiSettings}
                disabled={szoiLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: szoiLoading ? 'wait' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {szoiLoading ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
