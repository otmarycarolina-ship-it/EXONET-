import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- TUS CREDENCIALES REALES ---
const firebaseConfig = {
  apiKey: "AIzaSyDnHE7OUOpDuvJ6ULgN9pokklos41LF57w",
  authDomain: "exonet-16b9b.firebaseapp.com",
  projectId: "exonet-16b9b",
  storageBucket: "exonet-16b9b.firebasestorage.app",
  messagingSenderId: "375310722928",
  appId: "1:375310722928:web:a4f49d56dafa0d47b291b5",
  measurementId: "G-8JHJ5PQR7N"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [pass, setPass] = useState('');

  const login = () => {
    if (pass === 'Admin123') {
      signInAnonymously(auth);
      setIsLogged(true);
    } else {
      alert('Clave incorrecta');
    }
  };

  if (!isLogged) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#1B5E20' }}>EXONET LOGIN</h1>
        <input 
          type="password" 
          placeholder="Clave Admin123" 
          onChange={(e) => setPass(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <br/><br/>
        <button onClick={login} style={{ padding: '10px 20px', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '8px' }}>
          ENTRAR
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', paddingTop: '50px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2E7D32' }}>🚀 SISTEMA EXONET CONECTADO</h1>
      <p>Bienvenida, Otmary. El proyecto <b>{firebaseConfig.projectId}</b> está activo.</p>
    </div>
  );
}

// ESTA PARTE ES LA MÁS IMPORTANTE PARA EL ARCHIVO BLANCO
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
