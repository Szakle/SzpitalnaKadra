import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

// Funkcja walidująca sumę kontrolną PESEL
function validatePeselChecksum(pesel: string): boolean {
  if (pesel.length !== 11 || !/^\d{11}$/.test(pesel)) return false;
  
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(pesel[i]) * weights[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(pesel[10]);
}

// Funkcja wyciągająca datę urodzenia z PESEL
function getBirthDateFromPesel(pesel: string): Date | null {
  if (pesel.length !== 11) return null;
  
  let year = parseInt(pesel.substring(0, 2));
  let month = parseInt(pesel.substring(2, 4));
  const day = parseInt(pesel.substring(4, 6));
  
  if (month >= 1 && month <= 12) {
    year += 1900;
  } else if (month >= 21 && month <= 32) {
    year += 2000;
    month -= 20;
  } else if (month >= 41 && month <= 52) {
    year += 2100;
    month -= 40;
  } else if (month >= 61 && month <= 72) {
    year += 2200;
    month -= 60;
  } else if (month >= 81 && month <= 92) {
    year += 1800;
    month -= 80;
  } else {
    return null;
  }
  
  return new Date(year, month - 1, day);
}

// Funkcja wyciągająca płeć z PESEL (1 = kobieta, 2 = mężczyzna)
function getGenderFromPesel(pesel: string): number | null {
  if (pesel.length !== 11) return null;
  const genderDigit = parseInt(pesel[9]);
  return genderDigit % 2 === 0 ? 1 : 2;
}

export default function AddOsobaPage() {
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
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    
    // Automatycznie wypełnij datę urodzenia gdy wpisany poprawny PESEL
    if (name === 'pesel' && value.length === 11) {
      const birthDate = getBirthDateFromPesel(value);
      if (birthDate) {
        newForm.dataUrodzenia = birthDate.toISOString().split('T')[0];
      }
    }
    
    setForm(newForm);
    setErrors([]);
  };

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!form.imie.trim()) {
      validationErrors.push('Imię jest wymagane.');
    }
    
    if (!form.nazwisko.trim()) {
      validationErrors.push('Nazwisko jest wymagane.');
    }
    
    if (!/^\d{11}$/.test(form.pesel)) {
      validationErrors.push('PESEL musi składać się z 11 cyfr.');
      return validationErrors;
    }
    
    if (!validatePeselChecksum(form.pesel)) {
      validationErrors.push('Nieprawidłowa suma kontrolna PESEL.');
      return validationErrors;
    }
    
    return validationErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      // Użyj daty z formularza lub automatycznie wyciągnij z PESEL
      const plecId = getGenderFromPesel(form.pesel);
      let dataUrodzenia = form.dataUrodzenia;
      if (!dataUrodzenia) {
        const birthDate = getBirthDateFromPesel(form.pesel);
        dataUrodzenia = birthDate ? birthDate.toISOString().split('T')[0] : '';
      }
      
      const response = await api.post('/api/Osoba', {
        imie: form.imie,
        imie2: form.imie2,
        nazwisko: form.nazwisko,
        pesel: form.pesel,
        numerTelefonu: form.numerTelefonu,
        numerTelefonuWew: form.numerTelefonuWew,
        adresEmail: form.adresEmail,
        plecId: plecId || 1,
        dataUrodzenia: dataUrodzenia || null,
        typPersoneluId: 1,
      });
      
      const newPersonId = response.data.id;
      if (newPersonId) {
        navigate(`/edytuj-osobe-step2/${newPersonId}`);
      } else {
        showToast('Dodano osobę!', 'success');
      }
    } catch (err) {
      showToast('Błąd przy dodawaniu.', 'error');
    }
  };

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

  const peselDigits = form.pesel.padEnd(11, ' ').split('');

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Dodawanie zatrudnienia osoby personelu<br/>Dane osoby personelu</h2>

      {errors.length > 0 && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#721c24'
        }}>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

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
        <small style={{ color: '#666', fontSize: '11px' }}>
          Automatycznie wypełniana na podstawie PESEL
        </small>
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
          onClick={() => navigate('/osoby')}
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
