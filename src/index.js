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
    const unsubClientes = onSnapshot(collection(db, 'clientes'), (snap) => {
      setClientes(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubNodos = onSnapshot(collection(db, 'nodos'), (snap) => {
      setNodos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubSoporte = onSnapshot(collection(db, 'soporte'), (snap) => {
      setSoporteList(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubClientes(); unsubNodos(); unsubSoporte(); };
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
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100">
        <div className="flex flex-col items-center mb-10">
          <div style={{ backgroundColor: colors.sidebar }} className="p-5 rounded-3xl mb-4 shadow-lg"><ExonetLogo size={60} color="#FFF" /></div>
          <h1 style={{ color: colors.textMain }} className="text-4xl font-black tracking-tighter uppercase text-center">EXONET</h1>
          <p style={{ color: colors.primary }} className="font-bold tracking-widest text-[10px] uppercase mt-1">Sistemas de Gestión de Red</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-4 top-4" size={20} color={colors.primary} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Introducir Clave" />
          </div>
          <button style={{ backgroundColor: colors.sidebar }} className="w-full text-white font-black py-4 rounded-2xl shadow-md text-lg">ACCEDER AL PANEL</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen pb-24 md:pb-0 md:pl-64 text-gray-800 font-sans">
      <aside style={{ backgroundColor: colors.sidebar }} className="hidden md:flex flex-col w-64 h-full fixed left-0 top-0 p-8 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-12"><ExonetLogo size={32} color="#FFF" /><span className="text-2xl font-black text-white">EXONET</span></div>
        <nav className="flex-1 space-y-4">
          <NavItem active={activeTab === 'CLIENTES'} onClick={() => setActiveTab('CLIENTES')} icon={<Users />} label="CLIENTES" />
          <NavItem active={activeTab === 'SOPORTE'} onClick={() => setActiveTab('SOPORTE')} icon={<Wrench />} label="SOPORTE" />
          <NavItem active={activeTab === 'NODOS'} onClick={() => setActiveTab('NODOS')} icon={<ExonetLogo size={20} color="currentColor" />} label="REPARTIDORES" />
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto flex items-center gap-3 text-white/60 hover:text-white transition-all p-3 text-sm font-bold w-full"><LogOut size={18} /> CERRAR SESIÓN</button>
      </aside>

      <main className="p-4 md:p-10 max-w-[1400px] mx-auto">
        {activeTab === 'CLIENTES' && <ClientesView clientes={clientes} nodos={nodos} db={db} />}
        {activeTab === 'SOPORTE' && <SoporteView clientes={clientes} soporteList={soporteList} db={db} />}
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm ${active ? 'bg-white text-green-800 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon} <span>{label}</span>
    </button>
  );
}

// --- VISTAS HIJAS ---

function ClientesView({ clientes, nodos, db }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '', señalRemota: '', ap: '', esPrestamo: false });

  const filtered = clientes.filter(c => `${c.nombre} ${c.apellido} ${c.ip}`.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) await setDoc(doc(db, 'clientes', editingId), formData);
    else await addDoc(collection(db, 'clientes'), { ...formData, createdAt: Date.now() });
    setShowForm(false); setEditingId(null);
    setFormData({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '', señalRemota: '', ap: '', esPrestamo: false });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 style={{ color: colors.textMain }} className="text-3xl font-black tracking-tight">GESTIÓN DE CLIENTES</h2>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: colors.sidebar }} className="text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg">+ NUEVO CLIENTE</button>
      </div>
      <div className="bg-white mb-6 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input placeholder="Buscar abonado..." className="bg-transparent w-full p-4 outline-none font-medium" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-white hover:border-green-200 flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center">
            <div className="col-span-3 w-full">
               <div className="flex items-center gap-2">
                 <h3 style={{ color: colors.textMain }} className="font-bold text-lg leading-tight uppercase">{c.nombre} {c.apellido}</h3>
                 {c.esPrestamo && <span className="bg-orange-100 text-orange-700 text-[9px] px-2 py-0.5 rounded-full font-black">PRÉSTAMO</span>}
               </div>
               <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium"><MapPin size={12}/> {c.direccion}</p>
            </div>
            <div className="col-span-2 w-full text-center">
                <span style={{ backgroundColor: colors.bg, color: colors.textMain }} className="text-[10px] px-2 py-1 rounded-md font-bold inline-block mb-1">{c.ap}</span>
                <a href={`http://${c.ip}`} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-green-700 hover:underline flex items-center justify-center gap-1">
                  {c.ip} <ExternalLink size={10} />
                </a>
            </div>
            <div className="col-span-2 w-full flex flex-col items-center"><span style={{ color: colors.primary }} className="font-black italic">{c.plan} Mbps</span><p className="font-bold text-gray-800 text-sm">${c.costo}</p></div>
            <div className="col-span-2 w-full text-center"><div className="flex items-baseline justify-center gap-1 font-black text-gray-700"><span>{c.señal}</span><span className="text-gray-300 text-xs">/</span><span>{c.señalRemota}</span><span className="text-[10px] text-gray-400 ml-1">dBm</span></div></div>
            <div className="col-span-2 w-full flex justify-center"><a href={`tel:${c.telefono}`} className="text-gray-600 font-bold text-sm flex items-center gap-2"><Phone size={14} /> {c.telefono}</a></div>
            <div className="col-span-1 flex justify-center gap-2">
              <button onClick={() => { setFormData(c); setEditingId(c.id); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Pencil size={18} /></button>
              <button onClick={() => { if(window.confirm('¿Eliminar cliente?')) deleteDoc(doc(db, 'clientes', c.id)) }} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[95vh]">
            <h2 style={{ color: colors.textMain }} className="text-2xl font-black uppercase mb-8">Datos Cliente</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required placeholder="Nombre" className="bg-gray-50 p-4 rounded-xl border" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
              <input required placeholder="Apellido" className="bg-gray-50 p-4 rounded-xl border" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} />
              <input placeholder="Dirección" className="md:col-span-2 bg-gray-50 p-4 rounded-xl border" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              <input placeholder="Plan (Mbps)" type="number" className="bg-gray-50 p-4 rounded-xl border" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} />
              <input placeholder="Costo ($)" type="number" className="bg-gray-50 p-4 rounded-xl border" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
              <input placeholder="IP Antena" className="bg-gray-50 p-4 rounded-xl border font-mono" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} />
              <select className="bg-gray-50 p-4 rounded-xl border" value={formData.ap} onChange={e => setFormData({...formData, ap: e.target.value})}>
                <option value="">Seleccionar Nodo</option>
                {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
              </select>
              <input placeholder="Teléfono" className="bg-gray-50 p-4 rounded-xl border" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              <div className="flex gap-2">
                <input placeholder="Señal Local" className="w-1/2 bg-gray-50 p-4 rounded-xl border" value={formData.señal} onChange={e => setFormData({...formData, señal: e.target.value})} />
                <input placeholder="Señal Remota" className="w-1/2 bg-gray-50 p-4 rounded-xl border" value={formData.señalRemota} onChange={e => setFormData({...formData, señalRemota: e.target.value})} />
              </div>
              <div className="md:col-span-2 flex items-center gap-3 bg-green-50 p-4 rounded-2xl border border-green-100">
                <input 
                  type="checkbox" 
                  id="prestamo" 
                  className="w-5 h-5 accent-green-700" 
                  checked={formData.esPrestamo} 
                  onChange={e => setFormData({...formData, esPrestamo: e.target.checked})} 
                />
                <label htmlFor="prestamo" className="font-bold text-green-800 text-sm uppercase">Equipos en Calidad de Préstamo</label>
              </div>
              <button type="submit" style={{ backgroundColor: colors.sidebar }} className="md:col-span-2 py-5 rounded-2xl text-white font-black shadow-lg">GUARDAR CLIENTE</button>
              <button type="button" onClick={() => {setShowForm(false); setEditingId(null);}} className="md:col-span-2 text-gray-400 font-bold">CANCELAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NodosView({ nodos, clientes, db }) {
  const [nuevo, setNuevo] = useState({ nombre: '', ip: '' });

  const handleAddNodo = async (e) => {
    e.preventDefault();
    if(!nuevo.nombre.trim() || !nuevo.ip.trim()) {
      alert("Por favor ingresa nombre e IP del repartidor");
      return;
    }
    try {
      await addDoc(collection(db, 'nodos'), {
        nombre: nuevo.nombre.toUpperCase(),
        ip: nuevo.ip.trim()
      });
      setNuevo({ nombre: '', ip: '' });
    } catch (error) {
      console.error("Error al añadir repartidor:", error);
      alert("Error al conectar con la base de datos");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-10 uppercase">Repartidores</h2>
      <form onSubmit={handleAddNodo} className="bg-white p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 mb-10 border border-green-50">
        <input 
          placeholder="Nombre Nodo" 
          className="bg-gray-50 p-4 rounded-xl flex-1 border font-bold" 
          value={nuevo.nombre} 
          onChange={e => setNuevo({...nuevo, nombre: e.target.value})} 
        />
        <input 
          placeholder="IP" 
          className="bg-gray-50 p-4 rounded-xl flex-1 border font-mono" 
          value={nuevo.ip} 
          onChange={e => setNuevo({...nuevo, ip: e.target.value})} 
        />
        <button type="submit" style={{ backgroundColor: colors.sidebar }} className="text-white px-8 py-4 rounded-xl font-bold uppercase shadow-md active:scale-95 transition-transform">
          Añadir
        </button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {nodos.map(n => (
          <div key={n.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-600"></div>
            <button onClick={() => { if(window.confirm('¿Eliminar nodo?')) deleteDoc(doc(db, 'nodos', n.id)) }} className="absolute top-6 right-6 text-gray-200 hover:text-red-500"><Trash2 size={20} /></button>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{n.nombre}</h3>
            <a href={`http://${n.ip}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-green-600 font-bold mb-6 hover:underline flex items-center gap-1">
              {n.ip} <ExternalLink size={10} />
            </a>
            <div style={{ backgroundColor: colors.bg }} className="p-4 rounded-2xl flex justify-between items-center mt-4"><span className="text-[10px] font-black text-green-800 opacity-60 uppercase">Abonados</span><span style={{ color: colors.sidebar }} className="text-2xl font-black italic">{clientes.filter(c => c.ap === n.nombre).length}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoporteView({ clientes, db }) {
  const [report, setReport] = useState({ clienteId: '', falla: 'Sin internet', comentario: '' });
  
  const handleSend = async (e) => {
    e.preventDefault();
    if(!report.clienteId) return alert("Selecciona un cliente");
    
    const cli = clientes.find(c => c.id === report.clienteId);
    const prestamoStr = cli?.esPrestamo ? "✅ SÍ (PRÉSTAMO)" : "❌ NO (PROPIO)";
    
    const text = `🚨 *REPORTE EXONET*\n\n👤 *CLIENTE:* ${cli?.nombre} ${cli?.apellido}\n📍 *DIRECCIÓN:* ${cli?.direccion}\n🏠 *EQUIPOS EXONET:* ${prestamoStr}\n⚠️ *FALLA:* ${report.falla}\n💬 *NOTA:* ${report.comentario || 'Sin observaciones'}\n\n📅 _Generado desde Panel Gestión_`;
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(text)}`, '_blank');
    
    await addDoc(collection(db, 'soporte'), { 
        ...report, 
        timestamp: new Date().toLocaleString(), 
        clienteNombre: `${cli?.nombre} ${cli?.apellido}` 
    });
    setReport({ clienteId: '', falla: 'Sin internet', comentario: '' });
  };

  return (
    <div className="max-w-2xl mx-auto"><h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-8 uppercase">Soporte Técnico</h2>
      <form onSubmit={handleSend} className="bg-white p-10 rounded-[3rem] shadow-sm space-y-6">
        <select required className="w-full bg-gray-50 p-5 rounded-2xl border font-bold" value={report.clienteId} onChange={e => setReport({...report, clienteId: e.target.value})}>
          <option value="">-- SELECCIONAR CLIENTE --</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} {c.esPrestamo ? '🏠' : ''}</option>)}
        </select>
        <select className="w-full bg-gray-50 p-5 rounded-2xl border font-bold" value={report.falla} onChange={e => setReport({...report, falla: e.target.value})}>
          <option>Sin internet</option>
          <option>Lentitud extrema</option>
          <option>Antena apagada</option>
          <option>Problema de Router</option>
          <option>Cambio de clave</option>
        </select>
        <textarea placeholder="Observaciones adicionales..." className="w-full bg-gray-50 p-5 rounded-2xl border h-32" value={report.comentario} onChange={e => setReport({...report, comentario: e.target.value})} />
        <button type="submit" style={{ backgroundColor: colors.sidebar }} className="w-full py-5 rounded-2xl text-white font-black shadow-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"><Send size={24}/> ENVIAR A TELEGRAM</button>
      </form>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
