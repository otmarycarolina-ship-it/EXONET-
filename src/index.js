import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Users, 
  Wrench, 
  Plus, 
  Search, 
  Lock,
  LogOut,
  MapPin,
  Phone,
  Trash2,
  AlertCircle,
  Pencil,
  Save,
  X,
  Loader2,
  Send
} from 'lucide-react';

// --- CONFIGURACIÓN REAL DE FIREBASE (Tus credenciales) ---
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
const appId = 'exonet-v4-prod'; 

// Configuración de Colores
const colors = {
  bg: '#E8F5E9',
  sidebar: '#2E7D32',
  card: '#FFFFFF',
  primary: '#558B2F',
  accent: '#8BC34A',
  textMain: '#1B5E20',
  textMuted: '#666666',
  border: '#C5E1A5'
};

// --- LOGO EXONET ---
const ExonetLogo = ({ size = 48, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 25L75 75M75 25L25 75" stroke={color} strokeWidth="12" strokeLinecap="round"/>
    <path d="M60 40C75 30 85 35 90 45M60 40C75 20 85 25 90 30M60 40C75 10 85 15 90 20" stroke={color} strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('CLIENTES');
  const [loading, setLoading] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [nodos, setNodos] = useState([]);
  const [soporteList, setSoporteList] = useState([]);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Error Auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubClientes = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubNodos = onSnapshot(collection(db, 'nodos'), (snapshot) => {
      setNodos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubSoporte = onSnapshot(collection(db, 'soporte'), (snapshot) => {
      setSoporteList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => { unsubClientes(); unsubNodos(); unsubSoporte(); };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Admin123') setIsAuthenticated(true);
    else alert("Clave Incorrecta");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-green-50"><Loader2 className="animate-spin text-green-700" size={48} /></div>;

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100">
          <div className="flex flex-col items-center mb-10">
            <div style={{ backgroundColor: colors.sidebar }} className="p-5 rounded-3xl mb-4 shadow-lg"><ExonetLogo size={60} color="#FFF" /></div>
            <h1 style={{ color: colors.textMain }} className="text-4xl font-black tracking-tighter uppercase text-center">EXONET</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" placeholder="Clave Admin123" />
            <button style={{ backgroundColor: colors.sidebar }} className="w-full text-white font-black py-4 rounded-2xl shadow-md">ACCEDER</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen pb-24 md:pb-0 md:pl-64 text-gray-800">
      <aside style={{ backgroundColor: colors.sidebar }} className="hidden md:flex flex-col w-64 h-full fixed left-0 top-0 p-8 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-12"><ExonetLogo size={32} color="#FFF" /><span className="text-2xl font-black text-white">EXONET</span></div>
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('CLIENTES')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold ${activeTab === 'CLIENTES' ? 'bg-white text-green-800' : 'text-white/60'}`}><Users size={20}/> CLIENTES</button>
          <button onClick={() => setActiveTab('SOPORTE')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold ${activeTab === 'SOPORTE' ? 'bg-white text-green-800' : 'text-white/60'}`}><Wrench size={20}/> SOPORTE</button>
          <button onClick={() => setActiveTab('NODOS')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold ${activeTab === 'NODOS' ? 'bg-white text-green-800' : 'text-white/60'}`}><Plus size={20}/> NODOS</button>
        </nav>
      </aside>

      <main className="p-4 md:p-10">
        {activeTab === 'CLIENTES' && <ClientesView clientes={clientes} nodos={nodos} db={db} />}
        {activeTab === 'NODOS' && <NodosView nodos={nodos} clientes={clientes} db={db} />}
        {activeTab === 'SOPORTE' && <SoporteView clientes={clientes} soporteList={soporteList} db={db} />}
      </main>
    </div>
  );
}

// --- VISTAS HIJAS ---

function ClientesView({ clientes, nodos, db }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '-60', ap: 'CENTRAL' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'clientes'), formData);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-green-900 uppercase">Clientes</h2>
        <button onClick={() => setShowForm(true)} className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold">+ NUEVO</button>
      </div>
      <div className="grid gap-4">
        {clientes.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-black text-green-900 uppercase">{c.nombre} {c.apellido}</h3>
              <p className="text-xs text-gray-500">{c.direccion} | IP: {c.ip}</p>
            </div>
            <div className="text-right">
              <span className="font-black text-green-600">{c.plan}Mbps</span>
              <p className="text-sm font-bold">${c.costo}</p>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl w-full max-w-lg grid grid-cols-2 gap-4">
            <input placeholder="Nombre" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
            <input placeholder="Apellido" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} />
            <input placeholder="Dirección" className="col-span-2 p-3 border rounded-xl" onChange={e => setFormData({...formData, direccion: e.target.value})} />
            <input placeholder="IP" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, ip: e.target.value})} />
            <input placeholder="Plan" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, plan: e.target.value})} />
            <button type="submit" className="col-span-2 bg-green-700 text-white py-4 rounded-xl font-bold">GUARDAR</button>
            <button type="button" onClick={() => setShowForm(false)} className="col-span-2 text-gray-400 font-bold">CANCELAR</button>
          </form>
        </div>
      )}
    </div>
  );
}

function NodosView({ nodos, clientes, db }) {
  const [nuevo, setNuevo] = useState({ nombre: '', ip: '' });
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-black mb-8 uppercase text-green-900">Nodos Repartidores</h2>
      <div className="flex gap-4 mb-10">
        <input placeholder="Nombre Nodo" className="flex-1 p-4 rounded-xl border" onChange={e => setNuevo({...nuevo, nombre: e.target.value.toUpperCase()})} />
        <button onClick={() => addDoc(collection(db, 'nodos'), nuevo)} className="bg-green-700 text-white px-8 rounded-xl font-bold">AÑADIR</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nodos.map(n => (
          <div key={n.id} className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-green-600">
            <h3 className="text-xl font-black">{n.nombre}</h3>
            <p className="text-green-800 font-bold">Abonados: {clientes.filter(c => c.ap === n.nombre).length}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoporteView({ clientes, soporteList, db }) {
  const [falla, setFalla] = useState({ clienteId: '', falla: 'Sin internet', comentario: '' });
  const enviarSoporte = () => {
    const cli = clientes.find(c => c.id === falla.clienteId);
    const msj = `🚨 EXONET: ${cli?.nombre} - ${falla.falla}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(msj)}`);
  };
  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl">
      <h2 className="text-2xl font-black mb-6 uppercase text-green-900">Soporte Técnico</h2>
      <select className="w-full p-4 border rounded-xl mb-4 font-bold" onChange={e => setFalla({...falla, clienteId: e.target.value})}>
        <option>Seleccionar Cliente</option>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
      </select>
      <button onClick={enviarSoporte} className="w-full py-4 bg-green-700 text-white rounded-xl font-black flex items-center justify-center gap-2">
        <Send size={20}/> ENVIAR A TELEGRAM
      </button>
    </div>
  );
}

// RENDER FINAL
const root = createRoot(document.getElementById('root'));
root.render(<App />);
