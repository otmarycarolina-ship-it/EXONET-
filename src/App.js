import React, { useState, useEffect, useMemo } from 'react';
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

// --- CONFIGURACIÓN DE FIREBASE (TUS CREDENCIALES) ---
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
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('CLIENTES');
  const [loading, setLoading] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [nodos, setNodos] = useState([]);
  const [soporteList, setSoporteList] = useState([]);

  // Autenticación Anónima
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de autenticación:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Escucha de Datos en Tiempo Real
  useEffect(() => {
    if (!user) return;

    const clientesRef = collection(db, 'data', appId, 'clientes');
    const nodosRef = collection(db, 'data', appId, 'nodos');
    const soporteRef = collection(db, 'data', appId, 'soporte');

    const unsubClientes = onSnapshot(clientesRef, (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubNodos = onSnapshot(nodosRef, (snapshot) => {
      setNodos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubSoporte = onSnapshot(soporteRef, (snapshot) => {
      setSoporteList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => { unsubClientes(); unsubNodos(); unsubSoporte(); };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Admin123') { setIsAuthenticated(true); } 
    else { alert("Clave Incorrecta"); }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-green-700 mb-4" size={48} />
        <p className="font-bold text-green-800 uppercase text-xs">Iniciando Red Exonet...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100">
          <div className="flex flex-col items-center mb-10">
            <div style={{ backgroundColor: colors.sidebar }} className="p-5 rounded-3xl mb-4 shadow-lg">
              <ExonetLogo size={60} color="#FFF" />
            </div>
            <h1 style={{ color: colors.textMain }} className="text-4xl font-black tracking-tighter uppercase text-center">EXONET</h1>
            <p style={{ color: colors.primary }} className="font-bold text-[10px] uppercase mt-1">Gestión de Red Local</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Lock className="absolute left-4 top-4" size={20} color={colors.primary} />
              <input 
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                placeholder="Introducir Clave"
              />
            </div>
            <button style={{ backgroundColor: colors.sidebar }} className="w-full text-white font-black py-4 rounded-2xl shadow-md">
              ACCEDER
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen pb-24 md:pb-0 md:pl-64 text-gray-800 font-sans">
      {/* Sidebar Escritorio */}
      <aside style={{ backgroundColor: colors.sidebar }} className="hidden md:flex flex-col w-64 h-full fixed left-0 top-0 p-8 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-12">
          <ExonetLogo size={32} color="#FFF" />
          <span className="text-2xl font-black text-white">EXONET</span>
        </div>
        <nav className="flex-1 space-y-4">
          <NavItem active={activeTab === 'CLIENTES'} onClick={() => setActiveTab('CLIENTES')} icon={<Users />} label="CLIENTES" />
          <NavItem active={activeTab === 'SOPORTE'} onClick={() => setActiveTab('SOPORTE')} icon={<Wrench />} label="SOPORTE" />
          <NavItem active={activeTab === 'NODOS'} onClick={() => setActiveTab('NODOS')} icon={<ExonetLogo size={20} color="currentColor" />} label="NODOS" />
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-white/60 hover:text-white p-3 text-sm font-bold w-full">
          <LogOut size={18} /> CERRAR SESIÓN
        </button>
      </aside>

      <main className="p-4 md:p-10 max-w-[1400px] mx-auto">
        {activeTab === 'CLIENTES' && <ClientesView clientes={clientes} nodos={nodos} db={db} appId={appId} />}
        {activeTab === 'SOPORTE' && <SoporteView clientes={clientes} soporteList={soporteList} db={db} appId={appId} />}
        {activeTab === 'NODOS' && <NodosView nodos={nodos} clientes={clientes} db={db} appId={appId} />}
      </main>

      {/* Nav Móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4 z-50 shadow-lg">
        <button onClick={() => setActiveTab('CLIENTES')} className="flex flex-col items-center">
          <Users color={activeTab === 'CLIENTES' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'CLIENTES' ? colors.sidebar : '#CCC' }}>CLIENTES</span>
        </button>
        <button onClick={() => setActiveTab('SOPORTE')} className="flex flex-col items-center">
          <Wrench color={activeTab === 'SOPORTE' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'SOPORTE' ? colors.sidebar : '#CCC' }}>SOPORTE</span>
        </button>
        <button onClick={() => setActiveTab('NODOS')} className="flex flex-col items-center">
          <div style={{ color: activeTab === 'NODOS' ? colors.sidebar : '#CCC' }}>
            <ExonetLogo size={24} color="currentColor" />
          </div>
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'NODOS' ? colors.sidebar : '#CCC' }}>NODOS</span>
        </button>
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-white text-green-800 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
      {React.cloneElement(icon, { size: 20 })} 
      <span>{label}</span>
    </button>
  );
}

function ClientesView({ clientes, nodos, db, appId }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '-60', señalRemota: '-60', ap: 'CENTRAL' });

  const filtered = useMemo(() => clientes.filter(c => `${c.nombre} ${c.apellido} ${c.ip} ${c.ap}`.toLowerCase().includes(search.toLowerCase())), [clientes, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const collectionRef = collection(db, 'data', appId, 'clientes');
    try {
      if (editingId) { await setDoc(doc(collectionRef, editingId), formData); } 
      else { await addDoc(collectionRef, { ...formData, createdAt: Date.now() }); }
      setShowForm(false); setEditingId(null);
      setFormData({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '-60', señalRemota: '-60', ap: 'CENTRAL' });
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-green-900">CLIENTES</h2>
          <p className="text-sm font-bold text-green-700 opacity-60">{clientes.length} Registrados</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: colors.sidebar }} className="text-white px-6 py-3 rounded-2xl font-bold flex gap-2">
          <Plus /> NUEVO
        </button>
      </div>

      <div className="bg-white mb-6 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input placeholder="Buscar abonado..." className="w-full p-4 outline-none font-medium" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center">
            <div className="col-span-4 w-full">
              <h3 className="font-black text-green-900 uppercase">{c.nombre} {c.apellido}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12}/> {c.direccion}</p>
            </div>
            <div className="col-span-2 w-full text-center">
              <span className="text-[10px] bg-green-50 text-green-800 px-2 py-1 rounded font-black">{c.ap}</span>
              <p className="font-mono text-xs font-bold text-green-700">{c.ip}</p>
            </div>
            <div className="col-span-2 w-full text-center">
              <span className="font-black text-green-600 text-lg">{c.plan}M</span>
              <p className="font-bold text-gray-800">${c.costo}</p>
            </div>
            <div className="col-span-4 flex justify-end gap-2">
              <a href={`tel:${c.telefono}`} className="text-gray-600 bg-gray-50 p-2 rounded-xl border"><Phone size={18} /></a>
              <button onClick={() => { setFormData(c); setEditingId(c.id); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Pencil size={18} /></button>
              <button onClick={async () => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db, 'data', appId, 'clientes', c.id)); }} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 uppercase">{editingId ? 'Editar' : 'Nuevo'} Cliente</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input required placeholder="Nombre" className="p-4 bg-gray-50 rounded-xl border" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
              <input required placeholder="Apellido" className="p-4 bg-gray-50 rounded-xl border" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} />
              <input required placeholder="Dirección" className="col-span-2 p-4 bg-gray-50 rounded-xl border" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              <input required placeholder="Plan Mbps" type="number" className="p-4 bg-gray-50 rounded-xl border" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} />
              <input required placeholder="Costo $" type="number" className="p-4 bg-gray-50 rounded-xl border" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
              <input required placeholder="IP Local" className="p-4 bg-gray-50 rounded-xl border" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} />
              <select className="p-4 bg-gray-50 rounded-xl border" value={formData.ap} onChange={e => setFormData({...formData, ap: e.target.value})}>
                {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
                <option value="CENTRAL">CENTRAL</option>
              </select>
              <input placeholder="WhatsApp" className="p-4 bg-gray-50 rounded-xl border" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              <div className="flex gap-2">
                <input placeholder="Loc" className="w-1/2 p-4 bg-gray-50 rounded-xl border text-center" value={formData.señal} onChange={e => setFormData({...formData, señal: e.target.value})} />
                <input placeholder="Rem" className="w-1/2 p-4 bg-gray-50 rounded-xl border text-center" value={formData.señalRemota} onChange={e => setFormData({...formData, señalRemota: e.target.value})} />
              </div>
              <div className="col-span-2 flex gap-3 mt-4">
                <button type="submit" style={{ backgroundColor: colors.sidebar }} className="flex-1 py-4 rounded-2xl text-white font-black">GUARDAR</button>
                <button type="button" onClick={() => {setShowForm(false); setEditingId(null);}} className="bg-gray-200 px-6 rounded-2xl font-black">SALIR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NodosView({ nodos, clientes, db, appId }) {
  const [nuevo, setNuevo] = useState({ nombre: '', ip: '' });
  const addNodo = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'data', appId, 'nodos'), nuevo);
    setNuevo({ nombre: '', ip: '' });
  };
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-black mb-8">REPARTIDORES (NODOS)</h2>
      <form onSubmit={addNodo} className="bg-white p-6 rounded-3xl shadow-sm flex gap-4 mb-8">
        <input placeholder="Nombre Nodo" className="flex-1 p-4 bg-gray-50 rounded-xl border uppercase font-bold" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value.toUpperCase()})} />
        <input placeholder="IP Gateway" className="flex-1 p-4 bg-gray-50 rounded-xl border font-mono" value={nuevo.ip} onChange={e => setNuevo({...nuevo, ip: e.target.value})} />
        <button style={{ backgroundColor: colors.sidebar }} className="px-8 rounded-xl text-white font-black">AÑADIR</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodos.map(n => (
          <div key={n.id} className="bg-white p-6 rounded-[2rem] shadow-sm relative border-l-8 border-green-600">
            <button onClick={async () => {if(confirm("¿Eliminar?")) await deleteDoc(doc(db, 'data', appId, 'nodos', n.id))}} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={20}/></button>
            <h3 className="text-xl font-black">{n.nombre}</h3>
            <p className="font-mono text-xs text-gray-400 mb-4">{n.ip}</p>
            <div className="bg-green-50 p-4 rounded-2xl flex justify-between items-center">
              <span className="font-bold text-green-800 text-xs">Abonados Conectados:</span>
              <span className="text-3xl font-black text-green-900">{clientes.filter(c => c.ap === n.nombre).length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoporteView({ clientes, soporteList, db, appId }) {
  const [report, setReport] = useState({ clienteId: '', falla: 'Sin internet', comentario: '' });
  const handleSend = async (e) => {
    e.preventDefault();
    const cli = clientes.find(c => c.id === report.clienteId);
    const text = `🚨 *EXONET*\n👤 *CLIENTE:* ${cli?.nombre} ${cli?.apellido}\n🏠 *DIR:* ${cli?.direccion}\n⚠️ *FALLA:* ${report.falla}\n💬 *NOTA:* ${report.comentario}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(text)}`, '_blank');
    await addDoc(collection(db, 'data', appId, 'soporte'), { ...report, timestamp: new Date().toLocaleString(), clienteNombre: cli?.nombre });
    setReport({ clienteId: '', falla: 'Sin internet', comentario: '' });
  };
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-black mb-8">SOPORTE TÉCNICO</h2>
      <form onSubmit={handleSend} className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
        <select required className="w-full p-4 bg-gray-50 rounded-xl border font-bold" value={report.clienteId} onChange={e => setReport({...report, clienteId: e.target.value})}>
          <option value="">-- SELECCIONAR CLIENTE --</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
        <select className="w-full p-4 bg-gray-50 rounded-xl border font-bold" value={report.falla} onChange={e => setReport({...report, falla: e.target.value})}>
          <option>Sin internet</option>
          <option>Lentitud extrema</option>
          <option>Falla de Router</option>
          <option>Antena Apagada</option>
        </select>
        <textarea placeholder="Detalles de la falla..." className="w-full p-4 bg-gray-50 rounded-xl border h-24" value={report.comentario} onChange={e => setReport({...report, comentario: e.target.value})} />
        <button style={{ backgroundColor: colors.sidebar }} className="w-full py-4 rounded-xl text-white font-black flex justify-center gap-2 shadow-lg hover:scale-105 transition-all"><Send /> ENVIAR A TELEGRAM</button>
      </form>
    </div>
  );
}
