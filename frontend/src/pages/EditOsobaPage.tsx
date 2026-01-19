import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function EditOsobaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    imie: '',
    imie2: '',
    nazwisko: '',
    pesel: '',
    dataUrodzenia: '',
    numerTelefonu: '',
    numerTelefonuWew: '',
    adresEmail: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/Osoba/${id}`)
      .then(res => {
        const data = res.data;
        setForm({
          imie: data.imie || '',
          imie2: data.imie2 || '',
          nazwisko: data.nazwisko || '',
          pesel: data.pesel || '',
          dataUrodzenia: data.dataUrodzenia ? data.dataUrodzenia.split('T')[0] : '',
          numerTelefonu: data.numerTelefonu || '',
          numerTelefonuWew: data.numerTelefonuWew || '',
          adresEmail: data.adresEmail || '',
        });
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

  const handleNext = () => {
    navigate(`/edytuj-osobe-step2/${id}`, { state: form });
  };

  const handleCancel = () => {
    navigate('/osoby');
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Ładowanie...</div>;
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '0.25rem',
    fontWeight: 500 as const,
    color: '#333'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box' as const,
    border: '1px solid #ccc',
    borderRadius: '4px'
  };

  // Rozdziel PESEL na pojedyncze cyfry do wyświetlenia
  const peselDigits = form.pesel.padEnd(11, ' ').split('');

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Edycja danych osoby personelu</h2>
      
      {/* PESEL */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>PESEL: <span style={{ color: 'red' }}>*</span></label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {peselDigits.map((digit, index) => (
            <div key={index} style={{
              width: '30px',
              height: '30px',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {digit}
            </div>
          ))}
        </div>
        <input 
          name="pesel" 
          value={form.pesel} 
          onChange={handleChange} 
          placeholder="Wprowadź PESEL"
          maxLength={11}
          style={{ ...inputStyle, marginTop: '8px' }}
        />
      </div>

      {/* Imię */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Imię: <span style={{ color: 'red' }}>*</span></label>
        <input 
          name="imie" 
          value={form.imie} 
          onChange={handleChange} 
          placeholder="Imię"
          style={inputStyle}
        />
      </div>

      {/* Drugie imię */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Drugie imię:</label>
        <input 
          name="imie2" 
          value={form.imie2} 
          onChange={handleChange} 
          placeholder="Drugie imię"
          style={inputStyle}
        />
      </div>

      {/* Nazwisko */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Nazwisko: <span style={{ color: 'red' }}>*</span></label>
        <input 
          name="nazwisko" 
          value={form.nazwisko} 
          onChange={handleChange} 
          placeholder="Nazwisko"
          style={inputStyle}
        />
      </div>

      {/* Data urodzenia */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Data urodzenia:</label>
        <input 
          name="dataUrodzenia" 
          type="date"
          value={form.dataUrodzenia} 
          onChange={handleChange} 
          style={inputStyle}
        />
      </div>

      {/* Numer telefonu */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Numer telefonu:</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '8px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}>+48</span>
          <input 
            name="numerTelefonu" 
            value={form.numerTelefonu} 
            onChange={handleChange} 
            placeholder="Numer telefonu"
            style={{ ...inputStyle, flex: 1 }}
          />
          <span>wew.</span>
          <input 
            name="numerTelefonuWew" 
            value={form.numerTelefonuWew} 
            onChange={handleChange} 
            placeholder=""
            style={{ ...inputStyle, width: '80px' }}
          />
        </div>
      </div>

      {/* Adres e-mail */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Adres e-mail:</label>
        <input 
          name="adresEmail" 
          type="email"
          value={form.adresEmail} 
          onChange={handleChange} 
          placeholder="Adres e-mail"
          style={inputStyle}
        />
      </div>

      <p style={{ fontSize: '12px', color: '#666' }}>* pola wymagane</p>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
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
          onClick={handleNext}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Dalej →
        </button>
      </div>
    </div>
  );
}
