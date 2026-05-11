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
  addDoc,
  updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut 
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
  Printer,
  Wifi,
  CheckSquare,
  Square,
  ExternalLink,
  Laptop,
  MessageCircle 
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
const googleProvider = new GoogleAuthProvider();

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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" fill={color}/>
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('CLIENTES');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [clientes, setClientes] = useState([]);
  const [nodos, setNodos] = useState([]);
  const [soporteList, setSoporteList] = useState([]);

  const authorizedEmails = ['exonet2025@gmail.com', 'otmarycarolina@gmail.com'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && authorizedEmails.includes(u.email)) {
        setUser(u);
        setAuthError(null);
      } else if (u) {
        signOut(auth);
        setAuthError("No tienes permiso para acceder a esta aplicación.");
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubClientes = onSnapshot(collection(db, 'clientes'), (snap) => {
      const sorted = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setClientes(sorted);
    }, (err) => console.log("Error Firestore:", err));

    const unsubNodos = onSnapshot(collection(db, 'nodos'), (snap) => {
      const sorted = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setNodos(sorted);
    });

    const unsubSoporte = onSnapshot(collection(db, 'soporte'), (snap) => {
      setSoporteList(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    return () => { unsubClientes(); unsubNodos(); unsubSoporte(); };
  }, [user]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setAuthError("Error al conectar con Google.");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex flex-col items-center justify-center p-4">
      <Loader2 className="animate-spin text-green-700 mb-4" size={48} />
      <p className="font-black text-green-800 tracking-widest uppercase text-xs">Protegiendo Exonet...</p>
    </div>
  );

  if (!user) return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100">
        <div className="flex flex-col items-center mb-10">
          <div style={{ backgroundColor: colors.sidebar }} className="p-5 rounded-3xl mb-4 shadow-lg"><ExonetLogo size={60} color="#FFF" /></div>
          <h1 style={{ color: colors.textMain }} className="text-4xl font-black tracking-tighter uppercase text-center">EXONET</h1>
          <p style={{ color: colors.primary }} className="font-bold tracking-widest text-[10px] uppercase mt-1">Acceso Restringido</p>
        </div>
        
        {authError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-pulse">
            <AlertCircle size={20} />
            {authError}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-gray-100 hover:border-green-500 text-gray-700 font-black py-4 rounded-2xl shadow-sm text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
          ENTRAR CON GOOGLE
        </button>
        <p className="text-center text-[9px] text-gray-400 mt-6 uppercase font-bold tracking-widest">Solo personal autorizado</p>
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
          <NavItem active={activeTab === 'PRESTAMOS'} onClick={() => setActiveTab('PRESTAMOS')} icon={<Laptop />} label="EQUIPOS" />
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="text-[10px] text-white/40 font-bold mb-2 truncate">{user.email}</p>
          <button onClick={handleLogout} className="flex items-center gap-3 text-white/60 hover:text-white transition-all p-3 text-sm font-bold w-full"><LogOut size={18} /> CERRAR SESIÓN</button>
        </div>
      </aside>

      <main className="p-4 md:p-10 max-w-[1400px] mx-auto">
        {activeTab === 'CLIENTES' && <ClientesView clientes={clientes} nodos={nodos} db={db} />}
        {activeTab === 'SOPORTE' && <SoporteView clientes={clientes} db={db} />}
        {activeTab === 'NODOS' && <NodosView nodos={nodos} clientes={clientes} db={db} />}
        {activeTab === 'PRESTAMOS' && <PrestamosView clientes={clientes} db={db} />}
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
        <button onClick={() => setActiveTab('PRESTAMOS')} className="p-2 flex flex-col items-center">
          <Laptop color={activeTab === 'PRESTAMOS' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'PRESTAMOS' ? colors.sidebar : '#CCC' }}>EQUIPOS</span>
        </button>
        <button onClick={handleLogout} className="p-2 flex flex-col items-center text-red-300">
          <LogOut size={20} />
          <span className="text-[8px] font-bold mt-1">SALIR</span>
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

function PrestamosView({ clientes, db }) {
  const [search, setSearch] = useState('');

  const enPrestamo = clientes
    .filter(c => c.prestamo === true)
    .filter(c => `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Función de WhatsApp mejorada para Préstamos
  const handleWhatsApp = (cliente, numeroEspecifico) => {
    const mensaje = `*Hola*, ${cliente.nombre} 😊. Te saludamos de parte de *EXONET*, tu conexión a internet.\n\nPasamos por aquí para recordarte que la fecha de tu pago ha vencido. Nuestra prioridad es que sigas disfrutando de nuestro servicio sin interrupciones.\n\n*¡Gracias por tu preferencia!* 🌐`;
    const cleanNum = numeroEspecifico.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleCycleStatus = async (cliente) => {
    const estados = ['ACTIVO', 'REVISIÓN', 'PENDIENTE DE RETIRAR'];
    const currentIdx = estados.indexOf(cliente.estadoPrestamo || 'ACTIVO');
    const nextStatus = estados[(currentIdx + 1) % estados.length];
    
    try {
      await updateDoc(doc(db, 'clientes', cliente.id), { estadoPrestamo: nextStatus });
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'PENDIENTE DE RETIRAR':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'REVISIÓN':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      default:
        return 'bg-green-50 text-green-600 border-green-100';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-8 uppercase">Equipos a Préstamo</h2>
      
      <div className="bg-white mb-6 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input 
          placeholder="Buscar cliente con equipo prestado..." 
          className="bg-transparent w-full p-4 outline-none font-medium" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-green-50 overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b flex justify-between items-center">
           <span className="text-[10px] font-black text-green-800 tracking-widest uppercase">Lista Oficial de Préstamos</span>
           <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-bold">{enPrestamo.length} EQUIPOS</span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {enPrestamo.map((c, index) => (
            <div key={c.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-green-50/30 transition-colors gap-4">
              <div className="flex items-center gap-5">
                <span className="text-gray-300 font-black text-xl">{index + 1}</span>
                <div>
                  <h3 className="font-black text-gray-800 uppercase leading-none">{c.nombre} {c.apellido}</h3>
                  <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase flex items-center gap-1">
                    <MapPin size={10}/> {c.direccion}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* SOPORTE PARA MULTIPLES NÚMEROS EN PRÉSTAMOS */}
                {c.telefono.split(/[\s,+/]+/).filter(n => n.trim() !== "").map((num, i) => (
                  <button 
                    key={i}
                    onClick={() => handleWhatsApp(c, num)}
                    className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors flex items-center gap-1"
                    title={`Enviar a ${num}`}
                  >
                    <MessageCircle size={18} />
                    <span className="text-[9px] font-black hidden lg:inline">ENVIAR</span>
                  </button>
                ))}

                <div 
                  onClick={() => handleCycleStatus(c)}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${getStatusStyles(c.estadoPrestamo || 'ACTIVO')}`}
                >
                  <CheckSquare size={14} />
                  <span className="text-[10px] font-black">{c.estadoPrestamo || 'ACTIVO'}</span>
                </div>
                
                <div className="hidden sm:block text-right ml-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Nodo</p>
                  <p className="text-xs font-black text-green-700 uppercase">{c.ap}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClientesView({ clientes, nodos, db }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    nombre: '', apellido: '', direccion: '', plan: '', telefono: '', 
    costo: '', ip: '', señal: '', señalRemota: '', ap: '', prestamo: false,
    estadoPrestamo: 'ACTIVO'
  });

  const filtered = clientes.filter(c => `${c.nombre} ${c.apellido} ${c.ip}`.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ap) {
      alert("Por favor, selecciona un Nodo antes de guardar.");
      return;
    }
    
    try {
      if (editingId) await setDoc(doc(db, 'clientes', editingId), formData);
      else await addDoc(collection(db, 'clientes'), { ...formData, createdAt: Date.now() });
      setShowForm(false); setEditingId(null);
      setFormData({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '', señalRemota: '', ap: '', prestamo: false, estadoPrestamo: 'ACTIVO' });
    } catch (err) {
      alert("Error al procesar la solicitud.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h2 style={{ color: colors.textMain }} className="text-3xl font-black tracking-tight">GESTIÓN DE CLIENTES</h2>
          <span className="bg-green-700 text-white px-3 py-1 rounded-full text-sm font-black shadow-sm">
            {clientes.length} ABONADOS
          </span>
        </div>
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
              <h3 style={{ color: colors.textMain }} className="font-bold text-lg leading-tight uppercase">{c.nombre} {c.apellido}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium"><MapPin size={12}/> {c.direccion}</p>
              {c.prestamo && <p className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-1">EQUIPO A PRÉSTAMO</p>}
            </div>

            <div className="col-span-2 w-full text-center">
              <span style={{ backgroundColor: colors.bg, color: colors.textMain }} className="text-[10px] px-2 py-1 rounded-md font-bold inline-block mb-1">{c.ap}</span>
              <a href={`http://${c.ip}`} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-green-700 hover:underline flex items-center justify-center gap-1">{c.ip} <ExternalLink size={10} /></a>
            </div>

            <div className="col-span-2 w-full flex flex-col items-center">
              <span style={{ color: colors.primary }} className="font-black italic">{c.plan} Mbps</span>
              <p className="font-bold text-gray-800 text-sm">${c.costo}</p>
            </div>

            <div className="col-span-2 w-full text-center">
              <div className="flex flex-col items-center">
                 <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase tracking-tighter"><span>LOCAL</span><span>REMOTA</span></div>
                 <div className="flex items-baseline justify-center gap-1 font-black text-gray-700 text-lg tracking-tighter">
                   <span>{c.señal}</span><span className="text-gray-300 mx-0.5">/</span><span>{c.señalRemota}</span>
                   <span className="text-[10px] text-gray-400 ml-1 font-bold">dBm</span>
                 </div>
              </div>
            </div>

            {/* SECCIÓN DE CONTACTO PARA MÚLTIPLES NÚMEROS */}
            <div className="col-span-2 w-full flex flex-col gap-2 border-l pl-4">
              {c.telefono.split(/[\s,+/]+/).filter(num => num.trim() !== "").map((num, idx) => {
                const cleanNum = num.replace(/[^\d+]/g, '');
                return (
                  <div key={idx} className="flex items-center justify-between bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <span className="text-[10px] font-black text-gray-600">{num.trim()}</span>
                    <div className="flex gap-2">
                      <a 
                        href={`tel:${cleanNum}`} 
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        title="Llamar"
                      >
                        <Phone size={14} />
                      </a>
                      <a 
                        href={`https://wa.me/${cleanNum.replace('+', '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                        title="WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="col-span-1 flex justify-center gap-2">
              <button onClick={() => { setFormData(c); setEditingId(c.id); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Pencil size={18} /></button>
              <button onClick={() => deleteDoc(doc(db, 'clientes', c.id))} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[95vh]">
            <h2 style={{ color: colors.textMain }} className="text-2xl font-black uppercase mb-8">Datos del cliente</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required placeholder="Nombre" className="bg-gray-50 p-4 rounded-xl border" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
              <input required placeholder="Apellido" className="bg-gray-50 p-4 rounded-xl border" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} />
              <input placeholder="Dirección" className="md:col-span-2 bg-gray-50 p-4 rounded-xl border" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              <input placeholder="Plan (Mbps)" type="text" inputMode="numeric" className="bg-gray-50 p-4 rounded-xl border" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} />
              <input placeholder="Costo ($)" type="text" inputMode="decimal" className="bg-gray-50 p-4 rounded-xl border" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
              <input placeholder="IP" type="text" inputMode="decimal" className="bg-gray-50 p-4 rounded-xl border font-mono" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} />
              
              <select 
                required 
                className="bg-gray-50 p-4 rounded-xl border focus:border-green-500 outline-none" 
                value={formData.ap} 
                onChange={e => setFormData({...formData, ap: e.target.value})}
              >
                <option value="">-- SELECCIONAR NODO --</option>
                {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
              </select>

              <input required placeholder="Teléfonos (sepáralos con coma)" type="text" className="bg-gray-50 p-4 rounded-xl border" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              
              <div className="flex gap-2">
                <input placeholder="Señal Local" type="text" className="w-1/2 bg-gray-50 p-4 rounded-xl border" value={formData.señal} onChange={e => setFormData({...formData, señal: e.target.value})} />
                <input placeholder="Señal Remota" type="text" className="w-1/2 bg-gray-50 p-4 rounded-xl border" value={formData.señalRemota} onChange={e => setFormData({...formData, señalRemota: e.target.value})} />
              </div>

              <div onClick={() => setFormData({...formData, prestamo: !formData.prestamo})} className="md:col-span-2 flex items-center gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100 cursor-pointer select-none">
                {formData.prestamo ? <CheckSquare className="text-orange-600" /> : <Square className="text-gray-300" />}
                <span className="font-bold text-gray-700">Equipos a préstamo</span>
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

// --- VISTAS DE NODOS Y SOPORTE ---
function NodosView({ nodos, clientes, db }) {
  const [nuevo, setNuevo] = useState({ nombre: '', ip: '', frecuencia: '' });
  
  const handleAdd = async () => {
    try {
      await addDoc(collection(db, 'nodos'), nuevo);
      setNuevo({nombre:'', ip:'', frecuencia:''});
    } catch (e) { alert("Sin permisos"); }
  };

  const handlePrintNodo = (nodo, clientesNodo) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Exonet - ${nodo.nombre}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #2E7D32; border-bottom: 2px solid #2E7D32; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h1>NODO: ${nodo.nombre}</h1>
          <p>IP: ${nodo.ip} | Frecuencia: ${nodo.frecuencia} MHz</p>
          <table>
            <thead>
              <tr><th>CLIENTE</th><th>IP</th><th>PLAN</th><th>TELÉFONOS</th></tr>
            </thead>
            <tbody>
              ${clientesNodo.map(c => `<tr><td>${c.nombre} ${c.apellido}</td><td>${c.ip}</td><td>${c.plan} Mbps</td><td>${c.telefono}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-10 uppercase">Repartidores</h2>
      <div className="bg-white p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 mb-10 border border-green-50">
        <input placeholder="Nombre Nodo" className="bg-gray-50 p-4 rounded-xl flex-1 border font-bold" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value.toUpperCase()})} />
        <input placeholder="IP" className="bg-gray-50 p-4 rounded-xl border font-mono w-40" value={nuevo.ip} onChange={e => setNuevo({...nuevo, ip: e.target.value})} />
        <input placeholder="MHz" className="bg-gray-50 p-4 rounded-xl border w-40" value={nuevo.frecuencia} onChange={e => setNuevo({...nuevo, frecuencia: e.target.value})} />
        <button onClick={handleAdd} style={{ backgroundColor: colors.sidebar }} className="text-white px-8 py-4 rounded-xl font-bold">AÑADIR</button>
      </div>
      <div className="grid grid-cols-1 gap-8">
        {nodos.map(n => {
          const clientesNodo = clientes.filter(c => c.ap === n.nombre);
          return (
            <div key={n.id} className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center bg-gray-50/30">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">{n.nombre}</h3>
                  <p className="font-mono text-xs text-gray-400">{n.ip} | {n.frecuencia} MHz</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => handlePrintNodo(n, clientesNodo)} className="text-gray-400 hover:text-green-600"><Printer /></button>
                    <button onClick={() => deleteDoc(doc(db, 'nodos', n.id))} className="text-gray-300 hover:text-red-500"><Trash2 /></button>
                </div>
              </div>
              <div className="p-6 space-y-2">
                {clientesNodo.map(c => (
                  <div key={c.id} className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm font-bold">
                    <span>{c.nombre} {c.apellido}</span>
                    <span className="text-green-700">{c.ip}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SoporteView({ clientes, db }) {
  const [report, setReport] = useState({ clienteId: '', falla: 'Sin internet', comentario: '' });
  
  const handleSend = async (e) => {
    e.preventDefault();
    const cli = clientes.find(c => c.id === report.clienteId);
    if(!cli) return alert("Selecciona un cliente");
    
    const text = `🚨 REPORTE EXONET\n👤 CLIENTE: ${cli?.nombre} ${cli?.apellido}\n⚠️ FALLA: ${report.falla}\n💬 NOTA: ${report.comentario}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(text)}`, '_blank');
    
    try {
      await addDoc(collection(db, 'soporte'), { 
        ...report, 
        timestamp: new Date().toLocaleString(), 
        clienteNombre: `${cli?.nombre} ${cli?.apellido}` 
      });
      setReport({ clienteId: '', falla: 'Sin internet', comentario: '' });
    } catch (e) { console.log(e); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-8 uppercase">Soporte Técnico</h2>
      <form onSubmit={handleSend} className="bg-white p-10 rounded-[3rem] shadow-sm space-y-6">
        <select required className="w-full bg-gray-50 p-5 rounded-2xl border font-bold" value={report.clienteId} onChange={e => setReport({...report, clienteId: e.target.value})}>
          <option value="">-- SELECCIONAR CLIENTE --</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
        <select className="w-full bg-gray-50 p-5 rounded-2xl border font-bold" value={report.falla} onChange={e => setReport({...report, falla: e.target.value})}>
          <option>Sin internet</option>
          <option>Lentitud</option>
          <option>Antena apagada</option>
          <option>LAN0: 10Mbps</option>
          <option>Otro</option>
        </select>
        <textarea placeholder="Observaciones..." className="w-full bg-gray-50 p-5 rounded-2xl border h-32" value={report.comentario} onChange={e => setReport({...report, comentario: e.target.value})} />
        <button type="submit" style={{ backgroundColor: colors.sidebar }} className="w-full py-5 rounded-2xl text-white font-black shadow-lg flex items-center justify-center gap-3"><Send /> ENVIAR REPORTE</button>
      </form>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
