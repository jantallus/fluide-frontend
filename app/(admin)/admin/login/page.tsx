"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus('Envoi en cours...');
    
    try {
      const res = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      console.log("Réponse reçue :", data);

      if (res.ok) {
  const data = await res.json();
  // IMPORTANT : On sépare le token du reste
  localStorage.setItem('token', data.token); 
  localStorage.setItem('user', JSON.stringify({ 
    first_name: data.first_name, 
    role: data.role 
  }));

  window.location.href = '/admin/dashboard';
}
    } catch (err: any) {
      alert("ERREUR RÉSEAU : " + err.message);
      setStatus('Erreur réseau : ' + err.message);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ backgroundColor: 'white', color: 'black', padding: '30px', borderRadius: '20px', display: 'inline-block', width: '300px' }}>
        <h2>CONNEXION FLUIDE</h2>
        <p style={{ color: 'red', fontSize: '12px' }}>{status}</p>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#000', color: '#fff', cursor: 'pointer' }}>
            ENTRER 🚀
          </button>
        </form>
      </div>
    </div>
  );
}