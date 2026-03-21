"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        alert("ALERTE : Le serveur a dit OUI. On tente la redirection vers le dashboard.");
        window.location.assign('/admin/dashboard');
      } else {
        setError(data.message || "Identifiants refusés");
      }
    } catch (err: any) {
      alert("ERREUR RÉSEAU : " + err.message);
      setError("Détail technique : " + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', color: '#1e293b' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>FLUIDE PRO</h1>
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '10px', marginBottom: '10px', fontSize: '12px' }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" style={{ width: '100%', padding: '15px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' }} value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd' }} value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>SE CONNECTER</button>
        </form>
      </div>
    </div>
  );
}