import React, { useState, useEffect } from 'react';
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
  Search, 
  Lock,
  LogOut,
  MapPin,
  Phone,
  Trash2,
  Pencil,
  Loader2,
  Send,
  ExternalLink
} from 'lucide-react';

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
  card: '#FFFFFF',
  primary: '#558B2F',
  accent: '#8BC34A',
  textMain: '#1B5E20',
  textMuted: '#666666',
  border: '#C5E1A5'
};

const ExonetLogo = ({ size = 48, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 25L75 75M75 25L25 75" stroke={color} strokeWidth="12" strokeLinecap="round"/>
    <path d="M60 40C75 30 85 35 90 45M60 40C75 20 85 25 90 30M60 40C75 10 85 15 90 20" stroke={color} strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('CLIENTES');
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [nodos, setNodos] = useState([]);

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
    const unsubClientes = onSnapshot(collection(db, 'clientes'), (snap) => {
      setClientes(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubNodos = onSnapshot(collection(db, 'nodos'), (snap) => {
      setNodos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubClientes(); unsubNodos(); };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Admin123') setIsAuthenticated(true);
    else alert("Contraseña incorrecta");
  };

  if (loading) return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex flex-col items-center justify-center p-4">
      <Loader2 className="animate-spin text-green-700 mb-4" size={48} />
      <p className="font-black text-green-800 tracking-widest uppercase text-xs">Sincronizando Exonet...</p>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100">
        <div className="flex flex-col items-center mb-10">
          <div style={{ backgroundColor: colors.sidebar }} className="p-5 rounded-3xl mb-4 shadow-lg"><ExonetLogo size={60} color="#FFF" /></div>
          <h1 style={{ color: colors.textMain }} className="text-4xl font-black tracking-tighter uppercase">EXONET</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-4 top-4" size={20} color={colors.primary} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Introducir Clave" />
          </div>
          <button type="submit" style={{ backgroundColor: colors.sidebar }} className="w-full text-white font-black py-4 rounded-2xl shadow-md text-lg">ACCEDER</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen pb-24 md:pb-0 md:pl-64 text-gray-800">
      <aside style={{ backgroundColor: colors.sidebar }} className="hidden md:flex flex-col w-64 h-full fixed left-0 top-0 p-8 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-12"><ExonetLogo size={32} color="#FFF" /><span className="text-2xl font-black text-white">EXONET</span></div>
        <nav className="flex-1 space-y-4">
          <NavItem active={activeTab === 'CLIENTES'} onClick={() => setActiveTab('CLIENTES')} icon={<Users />} label="CLIENTES" />
          <NavItem active={activeTab === 'SOPORTE'} onClick={() => setActiveTab('SOPORTE')} icon={<Wrench />} label="SOPORTE" />
          <NavItem active={activeTab === 'NODOS'} onClick={() => setActiveTab('NODOS')} icon={<ExonetLogo size={20} color="currentColor" />} label="NODOS" />
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto flex items-center gap-3 text-white/60 hover:text-white transition-all p-3 text-sm font-bold w-full"><LogOut size={18} /> CERRAR SESIÓN</button>
      </aside>

      <main className="p-4 md:p-10 max-w-[1400px] mx-auto">
        {activeTab === 'CLIENTES' && <ClientesView clientes={clientes} nodos={nodos} db={db} />}
        {activeTab === 'SOPORTE' && <SoporteView clientes={clientes} db={db} />}
        {activeTab === 'NODOS' && <NodosView nodos={nodos} clientes={clientes} db={db} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4 z-50 shadow-lg">
        <button onClick={() => setActiveTab('CLIENTES')} className="p-2 flex flex-col items-center">
          <Users color={activeTab === 'CLIENTES' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'CLIENTES' ? colors.sidebar : '#CCC' }}>CLIENTES</span>
        </button>
        <button onClick={() => setActiveTab('SOPORTE')} className="p-2 flex flex-col items-center">
          <Wrench color={activeTab === 'SOPORTE' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'SOPORTE' ? colors.sidebar : '#CCC' }}>SOPORTE</span>
        </button>
        <button onClick={() => setActiveTab('NODOS')} className="p-2 flex flex-col items-center">
          <div style={{ color: activeTab === 'NODOS' ? colors.sidebar : '#CCC' }}><ExonetLogo size={24} color="currentColor" /></div>
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'NODOS' ? colors.sidebar : '#CCC' }}>NODOS</span>
        </button>
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm ${active ? 'bg-white text-green-800 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon} <span>{label}</span>
    </button>
  );
}

function ClientesView({ clientes, nodos, db }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '', señalRemota: '', ap: '', esPrestamo: false });

  const filtered = clientes.filter(c => `${c.nombre} ${c.apellido} ${c.ip}`.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'clientes'), { ...formData, createdAt: Date.now() });
      setShowForm(false);
      setFormData({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '', señalRemota: '', ap: '', esPrestamo: false });
    } catch (err) { alert("Error al guardar"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ color: colors.textMain }} className="text-3xl font-black uppercase">Clientes</h2>
        <button type="button" onClick={() => setShowForm(true)} style={{ backgroundColor: colors.sidebar }} className="text-white px-6 py-3 rounded-2xl font-bold shadow-lg">+ NUEVO</button>
      </div>
      <div className="bg-white mb-6 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input placeholder="Buscar..." className="w-full p-4 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center border border-white hover:border-green-200 transition-all">
            <div className="flex flex-col">
              <span className="font-bold uppercase text-green-900">{c.nombre} {c.apellido} {c.esPrestamo && '🏠'}</span>
              <span className="text-xs text-gray-400 font-mono">{c.direccion}</span>
            </div>
            <a href={`http://${c.ip}`} target="_blank" rel="noreferrer" className="text-green-600 font-black font-mono flex items-center gap-1 hover:underline">
              {c.ip} <ExternalLink size={12}/>
            </a>
            <div className="flex gap-2">
              <button type="button" onClick={() => deleteDoc(doc(db, 'clientes', c.id))} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <input required placeholder="Nombre" className="p-4 bg-gray-50 rounded-xl border" onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
              <input required placeholder="Apellido" className="p-4 bg-gray-50 rounded-xl border" onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} />
              <input placeholder="IP Antena" className="p-4 bg-gray-50 rounded-xl border" onChange={e => setFormData({...formData, ip: e.target.value})} />
              <select className="p-4 bg-gray-50 rounded-xl border" onChange={e => setFormData({...formData, ap: e.target.value})}>
                <option value="">Seleccionar Nodo</option>
                {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
              </select>
              <label className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                <input type="checkbox" onChange={e => setFormData({...formData, esPrestamo: e.target.checked})} />
                <span className="text-xs font-bold text-green-800">EQUIPO EN PRÉSTAMO</span>
              </label>
              <button type="submit" style={{ backgroundColor: colors.sidebar }} className="py-4 text-white font-black rounded-xl shadow-lg">GUARDAR CLIENTE</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 font-bold">CERRAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NodosView({ nodos, db }) {
  const [nuevo, setNuevo] = useState({ nombre: '', ip: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!nuevo.nombre || !nuevo.ip) return;
    try {
      await addDoc(collection(db, 'nodos'), { nombre: nuevo.nombre.toUpperCase(), ip: nuevo.ip });
      setNuevo({ nombre: '', ip: '' });
    } catch (err) { alert("Error"); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-8 uppercase">Nodos Repartidores</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-8 bg-white p-4 rounded-3xl shadow-sm">
        <input placeholder="Nombre" className="flex-1 p-4 bg-gray-50 rounded-xl outline-none" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value})} />
        <input placeholder="IP" className="flex-1 p-4 bg-gray-50 rounded-xl outline-none" value={nuevo.ip} onChange={e => setNuevo({...nuevo, ip: e.target.value})} />
        <button type="submit" style={{ backgroundColor: colors.sidebar }} className="px-8 text-white font-black rounded-xl">AÑADIR</button>
      </form>
      <div className="grid gap-4">
        {nodos.map(n => (
          <div key={n.id} className="bg-white p-6 rounded-3xl border border-green-50 flex justify-between items-center shadow-sm">
            <div>
              <p className="font-black text-green-900 text-lg uppercase">{n.nombre}</p>
              <a href={`http://${n.ip}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-green-600 hover:underline">{n.ip}</a>
            </div>
            <button type="button" onClick={() => deleteDoc(doc(db, 'nodos', n.id))} className="p-3 text-red-300 hover:text-red-500"><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoporteView({ clientes, db }) {
  const [report, setReport] = useState({ clienteId: '', falla: 'Sin internet', comentario: '' });
  
  const handleSend = (e) => {
    e.preventDefault();
    const cli = clientes.find(c => c.id === report.clienteId);
    if(!cli) return alert("Selecciona un cliente");
    const prestamo = cli.esPrestamo ? "SÍ" : "NO";
    const text = `🚨 REPORTE EXONET\n👤 CLIENTE: ${cli.nombre} ${cli.apellido}\n🏠 PRÉSTAMO: ${prestamo}\n⚠️ FALLA: ${report.falla}\n💬 NOTA: ${report.comentario}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-8 uppercase">Soporte</h2>
      <form onSubmit={handleSend} className="bg-white p-10 rounded-[3rem] shadow-xl space-y-4">
        <select required className="w-full p-5 bg-gray-50 rounded-2xl border font-bold" onChange={e => setReport({...report, clienteId: e.target.value})}>
          <option value="">SELECCIONAR CLIENTE</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
        <select className="w-full p-5 bg-gray-50 rounded-2xl border font-bold" onChange={e => setReport({...report, falla: e.target.value})}>
          <option>Sin internet</option>
          <option>Lentitud</option>
          <option>Antena apagada</option>
        </select>
        <textarea placeholder="Observaciones..." className="w-full p-5 bg-gray-50 rounded-2xl border h-32" onChange={e => setReport({...report, comentario: e.target.value})} />
        <button type="submit" style={{ backgroundColor: colors.sidebar }} className="w-full py-5 text-white font-black rounded-2xl flex justify-center gap-2"><Send /> ENVIAR A TELEGRAM</button>
      </form>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
