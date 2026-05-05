import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Users, Wrench, Plus, Search, Lock, LogOut, MapPin, Phone, Trash2, Pencil, Save, X, Loader2, Send } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDnHE7OUOpDuvJ6ULgN9pokklos41LF57w",
  authDomain: "exonet-16b9b.firebaseapp.com",
  projectId: "exonet-16b9b",
  storageBucket: "exonet-16b9b.firebasestorage.app",
  messagingSenderId: "375310722928",
  appId: "1:375310722928:web:a4f49d56dafa0d47b291b5",
  measurementId: "G-8JHJ5PQR7N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const colors = {
  bg: '#E8F5E9',
  sidebar: '#2E7D32',
  textMain: '#1B5E20',
  primary: '#558B2F'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('CLIENTES');
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Error Auth:", err));
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'clientes'), (snap) => {
      setClientes(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando Exonet...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-black text-center mb-6">EXONET LOGIN</h1>
          <input 
            type="password" 
            className="w-full p-4 border rounded-xl mb-4" 
            placeholder="Clave de acceso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            onClick={() => password === 'Admin123' ? setIsAuthenticated(true) : alert("Error")}
            className="w-full py-4 bg-green-700 text-white rounded-xl font-bold"
          >
            ACCEDER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-green-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">EXONET</h2>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab('CLIENTES')} className="block w-full text-left p-2 hover:bg-green-700 rounded">Clientes</button>
          <button onClick={() => setIsAuthenticated(false)} className="block w-full text-left p-2 text-green-300">Salir</button>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <h2 className="text-3xl font-bold mb-4">{activeTab}</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          {clientes.length === 0 ? "No hay datos aún. ¡Agrega el primero!" : `Total: ${clientes.length}`}
        </div>
      </main>
    </div>
  );
}
