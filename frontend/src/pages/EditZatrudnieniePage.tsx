import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function EditZatrudnieniePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [osoba, setOsoba] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formularz z danymi podstawowymi i zatrudnieniem
  const [form, setForm] = useState({
    pesel: '',
    imie: '',
    imie2: '',
    nazwisko: '',
    numerTelefonu: '',
    dataZgonu: '',
    zatrudnienieDeklaracja: '',
    zatrudnionyOd: '',
    zatrudnionyDo: '',
    zatrudnienieBezterminowe: false,
    srednioczasowyCzasPracyGodziny: '',
    srednioczasowyCzasPracyMinuty: ''
  });

  const [zatrudnienieId, setZatrudnienieId] = useState<number | null>(null);

  useEffect(() => {
    // Pobierz dane osoby
    api.get(`/api/Osoba/${id}`)
      .then(res => {
        const data = res.data;
        setOsoba(data);
        setForm(prev => ({
          ...prev,
          pesel: data.pesel || '',
          imie: data.imie || '',
          imie2: data.imie2 || '',
          nazwisko: data.nazwisko || '',
          numerTelefonu: data.numerTelefonu || '',
          dataZgonu: data.dataZgonu ? data.dataZgonu.split('T')[0] : ''
        }));
      })
      .catch(err => {
        console.error('Błąd podczas pobierania danych osoby:', err);
      });

    // Pobierz dane zatrudnienia
    api.get(`/api/Zatrudnienie/osoba/${id}`)
      .then(res => {
        const data = res.data;
        setZatrudnienieId(data.id);
        
        // Parsuj czas pracy
        let godziny = '';
        let minuty = '';
        if (data.srednioczasowyCzasPracy) {
          const parts = data.srednioczasowyCzasPracy.split(':');
          godziny = parts[0] || '';
          minuty = parts[1] || '';
        }

        setForm(prev => ({
          ...prev,
          zatrudnienieDeklaracja: data.zatrudnienieDeklaracja || '',
          zatrudnionyOd: data.zatrudnionyOd ? data.zatrudnionyOd.split('T')[0] : '',
          zatrudnionyDo: data.zatrudnionyDo ? data.zatrudnionyDo.split('T')[0] : '',
          zatrudnienieBezterminowe: !data.zatrudnionyDo,
          srednioczasowyCzasPracyGodziny: godziny,
          srednioczasowyCzasPracyMinuty: minuty
        }));
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd podczas pobierania danych zatrudnienia:', err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleCancel = () => {
    navigate(`/zatrudnienie/${id}`);
  };

  const handleSubmit = async () => {
    try {
      // Zaktualizuj dane osoby
      const osobaPayload = {
        pesel: form.pesel || null,
        imie: form.imie,
        imie2: form.imie2 || null,
        nazwisko: form.nazwisko,
        numerTelefonu: form.numerTelefonu || null,
        dataUrodzenia: osoba.dataUrodzenia,
        nrPwz: osoba.nrPwz,
        plecId: osoba.plecId,
        typPersoneluId: osoba.typPersoneluId
      };

      await api.put(`/api/Osoba/${id}`, osobaPayload);

      // Zaktualizuj lub utwórz zatrudnienie
      const czasPracy = `${form.srednioczasowyCzasPracyGodziny || '0'}:${form.srednioczasowyCzasPracyMinuty || '0'}`;
      
      // Konwertuj daty na format ISO lub null
      const zatrudnionyOdDate = form.zatrudnionyOd ? new Date(form.zatrudnionyOd).toISOString() : null;
      const zatrudnionyDoDate = form.zatrudnienieBezterminowe ? null : (form.zatrudnionyDo ? new Date(form.zatrudnionyDo).toISOString() : null);
      
      const zatrudnieniePayload = {
        osobaId: Number(id),
        zatrudnienieDeklaracja: form.zatrudnienieDeklaracja || null,
        zatrudnionyOd: zatrudnionyOdDate,
        zatrudnionyDo: zatrudnionyDoDate,
        srednioczasowyCzasPracy: czasPracy
      };

      if (zatrudnienieId) {
        await api.put(`/api/Zatrudnienie/${zatrudnienieId}`, zatrudnieniePayload);
      } else {
        await api.post('/api/Zatrudnienie', zatrudnieniePayload);
      }

      showToast('Zaktualizowano dane!', 'success');
      navigate(`/zatrudnienie/${id}`);
    } catch (err) {
      console.error('Błąd przy zapisywaniu:', err);
      showToast('Błąd przy zapisywaniu danych.', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#0066cc', marginBottom: '1.5rem' }}>
        Edycja zatrudnionego personelu medycznego
      </h2>

      {/* Dane podstawowe */}
      <div style={{ 
        backgroundColor: '#e6f2ff', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        borderRadius: '4px'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Dane podstawowe
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontWeight: 'normal' }}>PESEL:</label>
          <input
            type="text"
            name="pesel"
            value={form.pesel}
            onChange={handleChange}
            maxLength={11}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '200px'
            }}
          />

          <label style={{ fontWeight: 'normal' }}>Imię:</label>
          <input
            type="text"
            name="imie"
            value={form.imie}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '300px'
            }}
          />

          <label style={{ fontWeight: 'normal' }}>Drugie imię:</label>
          <input
            type="text"
            name="imie2"
            value={form.imie2}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '300px'
            }}
          />

          <label style={{ fontWeight: 'normal' }}>Nazwisko:</label>
          <input
            type="text"
            name="nazwisko"
            value={form.nazwisko}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '300px'
            }}
          />

          <label style={{ fontWeight: 'normal' }}>Numer telefonu:</label>
          <input
            type="text"
            name="numerTelefonu"
            value={form.numerTelefonu}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '200px'
            }}
          />

          <label style={{ fontWeight: 'normal' }}>Data zgonu:</label>
          <input
            type="date"
            name="dataZgonu"
            value={form.dataZgonu}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '200px'
            }}
          />
        </div>
      </div>

      {/* Zatrudnienie */}
      <div style={{ 
        backgroundColor: '#e6f2ff', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        borderRadius: '4px'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Zatrudnienie
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontWeight: 'normal' }}>Zatrudnienie/deklaracja zatrudnienia:</label>
          <select
            name="zatrudnienieDeklaracja"
            value={form.zatrudnienieDeklaracja}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '200px'
            }}
          >
            <option value="">Wybierz...</option>
            <option value="ZATRUDNIONY">ZATRUDNIONY</option>
            <option value="DEKLARACJA">DEKLARACJA</option>
          </select>

          <label style={{ fontWeight: 'normal' }}>Zatrudniony od:</label>
          <input
            type="date"
            name="zatrudnionyOd"
            value={form.zatrudnionyOd}
            onChange={handleChange}
            style={{ 
              padding: '6px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              width: '200px'
            }}
          />

          <label style={{ fontWeight: 'normal' }}>Zatrudniony do:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="date"
              name="zatrudnionyDo"
              value={form.zatrudnionyDo}
              onChange={handleChange}
              disabled={form.zatrudnienieBezterminowe}
              style={{ 
                padding: '6px', 
                border: '1px solid #ccc',
                borderRadius: '3px',
                width: '200px',
                backgroundColor: form.zatrudnienieBezterminowe ? '#f5f5f5' : 'white'
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
              <input
                type="checkbox"
                name="zatrudnienieBezterminowe"
                checked={form.zatrudnienieBezterminowe}
                onChange={handleChange}
                style={{ marginRight: '6px' }}
              />
              Bezterminowo
            </label>
          </div>

          <label style={{ fontWeight: 'normal' }}>Śr. miesięczny czas pracy godziny/minuty:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              name="srednioczasowyCzasPracyGodziny"
              value={form.srednioczasowyCzasPracyGodziny}
              onChange={handleChange}
              min="0"
              max="23"
              placeholder="0"
              style={{ 
                width: '70px', 
                padding: '6px', 
                border: '1px solid #ccc',
                borderRadius: '3px',
                textAlign: 'center'
              }}
            />
            <span>:</span>
            <input
              type="number"
              name="srednioczasowyCzasPracyMinuty"
              value={form.srednioczasowyCzasPracyMinuty}
              onChange={handleChange}
              min="0"
              max="59"
              placeholder="0"
              style={{ 
                width: '70px', 
                padding: '6px', 
                border: '1px solid #ccc',
                borderRadius: '3px',
                textAlign: 'center'
              }}
            />
          </div>
        </div>
      </div>

      {/* Przyciski */}
      <div style={{ 
        marginTop: '2rem', 
        display: 'flex', 
        gap: '1rem',
        justifyContent: 'flex-start'
      }}>
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
