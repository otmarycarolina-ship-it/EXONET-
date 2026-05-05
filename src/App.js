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
  Loader2
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// Reemplaza estos valores con los de tu consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "tu-app.firebaseapp.com",
  projectId: "tu-app",
  storageBucket: "tu-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'exonet-system-v4';

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

// Componentes internos para evitar errores de carga
function NavItem({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm tracking-wide ${active ? 'bg-white text-green-800 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
    >
      {React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon} 
      <span>{label}</span>
    </button>
  );
}

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
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
        setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const clientesRef = collection(db, 'clientes');
    const nodosRef = collection(db, 'nodos');
    const soporteRef = collection(db, 'soporte');

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
    if (password === 'Admin123') setIsAuthenticated(true);
    else alert("Contraseña incorrecta");
  };

  if (loading) return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-green-700 mb-4" size={48} />
      <p className="font-bold text-green-800">CARGANDO EXONET...</p>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100">
        <div className="flex flex-col items-center mb-10">
          <div style={{ backgroundColor: colors.sidebar }} className="p-5 rounded-3xl mb-4 shadow-lg">
            <ExonetLogo size={60} color="#FFF" />
          </div>
          <h1 style={{ color: colors.textMain }} className="text-4xl font-black text-center">EXONET</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-gray-50 border rounded-2xl outline-none"
            placeholder="Contraseña"
          />
          <button style={{ backgroundColor: colors.sidebar }} className="w-full text-white font-black py-4 rounded-2xl">ACCEDER</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen md:pl-64 text-gray-800">
      <aside style={{ backgroundColor: colors.sidebar }} className="hidden md:flex flex-col w-64 h-full fixed left-0 top-0 p-8 z-50">
        <div className="flex items-center gap-3 mb-12">
          <ExonetLogo size={32} color="#FFF" />
          <span className="text-2xl font-black text-white">EXONET</span>
        </div>
        <nav className="flex-1 space-y-4">
          <NavItem active={activeTab === 'CLIENTES'} onClick={() => setActiveTab('CLIENTES')} icon={<Users />} label="CLIENTES" />
          <NavItem active={activeTab === 'SOPORTE'} onClick={() => setActiveTab('SOPORTE')} icon={<Wrench />} label="SOPORTE" />
          <NavItem active={activeTab === 'NODOS'} onClick={() => setActiveTab('NODOS')} icon={<ExonetLogo size={20} color="currentColor" />} label="NODOS" />
        </nav>
      </aside>
      <main className="p-4 md:p-10">
         <h1 className="text-2xl font-bold">Bienvenido a Exonet</h1>
         <p>Selecciona una opción en el menú para gestionar tu red.</p>
         {/* Aquí van las vistas que ya tienes (ClientesView, etc) */}
      </main>
    </div>
  );
}
