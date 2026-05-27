import React, { useState, useEffect, useRef } from 'react';
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
  Search, 
  LogOut,
  MapPin,
  Phone,
  Trash2,
  AlertCircle,
  Pencil,
  Loader2,
  Send,
  Printer,
  CheckSquare,
  Square,
  ExternalLink,
  Laptop,
  MessageCircle,
  DollarSign,
  Gift,
  Calendar,
  FileText,
  X,
  Clock,
  RefreshCw,
  Radio
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

// --- AUXILIARES DE FECHAS EN FORMATO LOCAL (YYYY-MM-DD) ---
const obtenerFechaActualLocal = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const obtenerEncabezadoMesActual = () => {
  const meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  const d = new Date();
  return `${meses[d.getMonth()]} DE ${d.getFullYear()}`;
};

// NUEVA LÓGICA DE CORTE: Fuerza el vencimiento al día 4 del mes siguiente del pago
const calcularVencimientoLocal = (fechaInicioStr) => {
  if (!fechaInicioStr) return '';
  const parts = fechaInicioStr.split('-');
  const ano = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1; // Base 0 en JS (0 = Enero)
  const dia = parseInt(parts[2], 10);
  
  const fechaPago = new Date(ano, mes, dia);
  
  let anoVencimiento = fechaPago.getFullYear();
  let mesVencimiento = fechaPago.getMonth() + 1; // Siguiente mes
  
  if (mesVencimiento > 11) {
    mesVencimiento = 0;
    anoVencimiento += 1;
  }
  
  const rMes = String(mesVencimiento + 1).padStart(2, '0');
  const rDia = '04'; // El corte es estricto el día 4
  return `${anoVencimiento}-${rMes}-${rDia}`;
};

const formatearFechaPantalla = (fechaStr) => {
  if (!fechaStr) return 'Sin Registro';
  const parts = fechaStr.split('-');
  if (parts.length !== 3) return fechaStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// --- OBTENER ESTADO DINÁMICO ---
const obtenerEstadoCliente = (cliente) => {
  if (cliente.exonerado) return 'SOLVENTE';
  
  const costoTotal = parseFloat(cliente.costo || 0);
  const abono = parseFloat(cliente.montoPagado || 0);
  
  if (cliente.pagoCompletado && cliente.esBolivares) return 'SOLVENTE';
  if (cliente.pagoCompletado && abono < costoTotal) return 'PENDIENTE';

  if (!cliente.fechaVencimiento) return 'PENDIENTE';
  
  const hoyStr = obtenerFechaActualLocal();
  return hoyStr <= cliente.fechaVencimiento ? 'SOLVENTE' : 'PENDIENTE';
};

// --- COMPROBAR SI ESTÁ PRÓXIMO A VENCER ---
const esProximoAVencer = (cliente) => {
  if (cliente.exonerado || !cliente.fechaVencimiento) return false;
  
  const costoTotal = parseFloat(cliente.costo || 0);
  const abono = parseFloat(cliente.montoPagado || 0);
  if (cliente.pagoCompletado && cliente.esBolivares) return false;
  if (cliente.pagoCompletado && abono < costoTotal) return false;

  const hoyStr = obtenerFechaActualLocal();
  if (hoyStr > cliente.fechaVencimiento) return false;
  
  const hoy = new Date(hoyStr.replace(/-/g, '\/'));
  const vencimiento = new Date(cliente.fechaVencimiento.replace(/-/g, '\/'));
  
  const diferenciaTiempo = vencimiento.getTime() - hoy.getTime();
  const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
  
  return diferenciaDias >= 0 && diferenciaDias <= 3;
};

// --- IMPRESIÓN DE COMPROBANTE DIGITAL ---
const handleGenerarRecibo = (cliente) => {
  const printWindow = window.open('', '_blank');
  const moneda = cliente.esBolivares ? 'Bs' : 'COP';
  
  const abonoNum = parseFloat(cliente.montoPagado || cliente.costo || 0);
  const montoFormateado = abonoNum.toFixed(3);
  const costoTotal = parseFloat(cliente.costo || 0);
  const abono = parseFloat(cliente.montoPagado || 0);
  const restante = !cliente.esBolivares ? Math.max(0, costoTotal - abono) : 0;
  
  const esPagoCompleto = cliente.esBolivares || (abono >= costoTotal);
  
  const html = `
    <html>
      <head>
        <title>Recibo Exonet - ${cliente.nombre} ${cliente.apellido}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #222; background: #f9f9f9; display: flex; justify-content: center; }
          .recibo-card { background: white; width: 450px; border: 1px solid #e0e0e0; border-radius: 16px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px dashed #2E7D32; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-title { font-size: 24px; font-weight: 900; color: #2E7D32; letter-spacing: 1px; margin: 5px 0; }
          .subtitle { font-size: 10px; color: #666; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
          .monto-box { background: #E8F5E9; color: #1B5E20; text-align: center; padding: 15px; border-radius: 12px; font-size: 28px; font-weight: 900; margin: 15px 0; border: 1px solid #C5E1A5; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details-table td { padding: 8px 0; font-size: 13px; color: #444; }
          .details-table td.label { color: #888; font-weight: bold; text-transform: uppercase; font-size: 11px; }
          .details-table td.value { text-align: right; font-weight: bold; color: #1B5E20; }
          .footer-msg { text-align: center; font-size: 12px; color: #1B5E20; font-weight: bold; margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px; line-height: 1.5; }
          @media print {
            body { background: white; padding: 0; }
            .recibo-card { border: none; box-shadow: none; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="recibo-card">
          <div class="header">
            <div class="logo-title">EXONET</div>
            <div class="subtitle">Comprobante de Pago Digital</div>
          </div>
          <div class="monto-box">${cliente.esBolivares ? '' : '$'}${montoFormateado} ${moneda}</div>
          <table class="details-table">
            <tr>
              <td class="label">Abonado</td>
              <td class="value" style="text-transform: uppercase;">${cliente.nombre} ${cliente.apellido}</td>
            </tr>
            <tr>
              <td class="label">Plan Contratado</td>
              <td class="value">${cliente.plan} Mbps ${cliente.ftth ? 'Fibra Óptica' : 'Inalámbrico'}</td>
            </tr>
            ${!esPagoCompleto && !cliente.esBolivares ? `
            <tr>
              <td class="label">Costo Total Plan</td>
              <td class="value">$${costoTotal.toFixed(3)} ${moneda}</td>
            </tr>
            ` : ''}
            ${!esPagoCompleto ? `
            <tr>
              <td class="label">Monto Abonado</td>
              <td class="value">${cliente.esBolivares ? '' : '$'}${montoFormateado} ${moneda}</td>
            </tr>
            ` : ''}
            ${restante > 0 ? `
            <tr>
              <td class="label" style="color: #c62828;">Saldo Restante Pendiente</td>
              <td class="value" style="color: #c62828;">$${restante.toFixed(3)} ${moneda}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label">Fecha de Pago</td>
              <td class="value">${formatearFechaPantalla(cliente.fechaPago)}</td>
            </tr>
            <tr>
              <td class="label">Próximo Vencimiento</td>
              <td class="value" style="color: #c62828;">${formatearFechaPantalla(cliente.fechaVencimiento)}</td>
            </tr>
            <tr>
              <td class="label">Referencia / Pago</td>
              <td class="value">${cliente.referenciaPago || 'Efectivo / Divisas'}</td>
            </tr>
          </table>
          <div class="footer-msg">
            ¡Gracias por tu solvencia y preferencia!<br>
            CONEXIÓN ESTABLE SIEMPRE.
          </div>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// --- IMPRESIÓN DE COMPROBANTE DIGITAL ---
const handlePrintClientesFiltrados = (data) => {
  const printWindow = window.open('', '_blank');
  const clientesFiltrados = data.filter(c => !c.exonerado && !c.ftth);
  const encabezadoMes = obtenerEncabezadoMesActual();

  const html = `
    <html>
      <head>
        <title>Exonet - LISTA GENERAL DE CLIENTES - ${encabezadoMes}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px; text-transform: uppercase; margin-bottom: 5px; }
          .meta-info { font-size: 13px; color: #555; margin-bottom: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #2E7D32; color: white; text-align: left; padding: 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border: 1px solid #ddd; font-size: 13px; }
          .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: right; border-top: 1px solid #eee; padding-top: 5px; }
        </style>
      </head>
      <body>
        <h1>EXONET - LISTA GENERAL DE CLIENTES (${encabezadoMes})</h1>
        <div class="meta-info">Total abonados: ${clientesFiltrados.length} | Fecha: ${new Date().toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>CLIENTE (NOMBRE Y APELLIDO)</th>
            </tr>
          </thead>
          <tbody>
            ${clientesFiltrados.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: bold; text-transform: uppercase;">${c.nombre} ${c.apellido}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Generado por Sistema de Gestión Exonet</div>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// --- UTILIDAD DE IMPRESIÓN GENERAL ---
const handlePrintGeneral = (titulo, data) => {
  const printWindow = window.open('', '_blank');
  const esPagos = titulo.includes('PAGOS');
  const esFibra = titulo.includes('FTTH') || titulo.includes('FIBRA');
  const esPrestamo = titulo.includes('PRÉSTAMO') || titulo.includes('EQUIPOS');
  const encabezadoMes = obtenerEncabezadoMesActual();
  
  let totalActivos = 0;
  let totalPendientes = 0;

  if (esFibra) {
    data.forEach(c => {
      const costoNum = parseFloat(c.costo) || 0;
      const estado = obtenerEstadoCliente(c);
      if (estado === 'SOLVENTE') {
        totalActivos += costoNum;
      } else {
        totalPendientes += costoNum;
      }
    });
  }

  const html = `
    <html>
      <head>
        <title>Exonet - ${titulo} - ${encabezadoMes}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px; text-transform: uppercase; margin-bottom: 5px; }
          .meta-info { font-size: 13px; color: #555; margin-bottom: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #2E7D32; color: white; text-align: left; padding: 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border: 1px solid #ddd; font-size: 12px; }
          .status-badge { font-weight: bold; padding: 3px 6px; border-radius: 4px; font-size: 11px; }
          .status-active { color: #2E7D32; }
          .status-suspended { color: #d32f2f; font-weight: bold; }
          .status-review { color: #f57c00; }
          .row-suspended { background-color: #ffebee; }
          .finanzas-container { margin-top: 30px; border-top: 3px double #2E7D32; padding-top: 15px; width: 100%; display: flex; justify-content: flex-end; }
          .finanzas-tabla { width: 320px; margin-left: auto; border: none; }
          .finanzas-tabla td { padding: 6px 10px; border: none; font-size: 14px; }
          .finanzas-total { font-size: 16px; font-weight: black; color: #2E7D32; background: #e8f5e9; }
          .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: right; border-top: 1px solid #eee; padding-top: 5px; }
        </style>
      </head>
      <body>
        <h1>EXONET - ${titulo} (${encabezadoMes})</h1>
        <div class="meta-info">Total registros: ${data.length} | Fecha: ${new Date().toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>CLIENTE (NOMBRE Y APELLIDO)</th>
              <th>ESTADO DEL EQUIPO</th>
              ${esFibra ? '<th>MONTO ($)</th>' : ''}
              <th>DIRECCIÓN</th>
              ${!esPrestamo ? '<th>VENCIMIENTO</th>' : ''}
              ${esPagos ? '<th>ESTADO DE PAGO</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${data.map((c, i) => {
              const estadoPago = obtenerEstadoCliente(c);
              let estadoVisual = 'ACTIVO';
              let claseEstado = 'status-active';
              let claseFila = '';
              let montoVisual = `$${parseFloat(c.costo || 0).toFixed(3)}`;

              if (esFibra) {
                if (estadoPago === 'PENDIENTE') {
                  estadoVisual = 'SIN SERVICIO';
                  claseEstado = 'status-suspended';
                  claseFila = 'class="row-suspended"';
                  montoVisual = '$0.000';
                } else if (c.estadoFTTH === 'REVISIÓN') {
                  estadoVisual = 'REVISIÓN';
                  claseEstado = 'status-review';
                } else if (c.estadoFTTH === 'PENDIENTE DE RETIRAR') {
                  estadoVisual = 'PENDIENTE DE RETIRAR';
                  claseEstado = 'status-suspended';
                }
              } else {
                estadoVisual = c.estadoPrestamo || c.estadoFTTH || 'ACTIVO';
              }

              return `
                <tr ${claseFila}>
                  <td>${i + 1}</td>
                  <td style="font-weight: bold; text-transform: uppercase;">${c.nombre} ${c.apellido}</td>
                  <td><span class="status-badge ${claseEstado}">${estadoVisual}</span></td>
                  ${esFibra ? `<td style="font-weight: bold;">${montoVisual}</td>` : ''}
                  <td>${c.direccion || 'N/A'}</td>
                  ${!esPrestamo ? `<td>${formatearFechaPantalla(c.fechaVencimiento)}</td>` : ''}
                  ${esPagos ? `<td>${estadoPago === 'SOLVENTE' ? 'AL DÍA' : 'PENDIENTE'}</td>` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${esFibra ? `
          <div class="finanzas-container">
            <table class="finanzas-tabla">
              <tr class="finanzas-total">
                <td><strong>TOTAL RECAUDADO (ACTIVOS):</strong></td>
                <td style="text-align: right; font-weight: 900;"><strong>$${totalActivos.toFixed(3)}</strong></td>
              </tr>
              <tr style="color: #666; font-size: 12px;">
                <td>Total por Recaudar (Morosidad):</td>
                <td style="text-align: right; font-weight: bold; color: #c62828;">$${totalPendientes.toFixed(3)}</td>
              </tr>
            </table>
          </div>
        ` : ''}

        <div class="footer">Generado por Sistema de Gestión Exonet</div>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

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
        .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true, sensitivity: 'base' }));
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
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-green-100 mx-auto">
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
          <NavItem active={activeTab === 'PAGOS'} onClick={() => setActiveTab('PAGOS')} icon={<DollarSign />} label="PAGOS" />
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
        {activeTab === 'PAGOS' && <PagosView clientes={clientes} db={db} />}
        {activeTab === 'SOPORTE' && <SoporteView clientes={clientes} nodos={nodos} db={db} />}
        {activeTab === 'NODOS' && <NodosView nodos={nodos} clientes={clientes} db={db} />}
        {activeTab === 'PRESTAMOS' && <ItemManagementView clientes={clientes} db={db} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4 z-50 shadow-lg">
        <button onClick={() => setActiveTab('CLIENTES')} className="p-2 flex flex-col items-center">
          <Users color={activeTab === 'CLIENTES' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'CLIENTES' ? colors.sidebar : '#CCC' }}>CLIENTES</span>
        </button>
        <button onClick={() => setActiveTab('PAGOS')} className="p-2 flex flex-col items-center">
          <DollarSign color={activeTab === 'PAGOS' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'PAGOS' ? colors.sidebar : '#CCC' }}>PAGOS</span>
        </button>
        <button onClick={() => setActiveTab('SOPORTE')} className="p-2 flex flex-col items-center">
          <Wrench color={activeTab === 'SOPORTE' ? colors.sidebar : '#CCC'} />
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'SOPORTE' ? colors.sidebar : '#CCC' }}>SOPORTE</span>
        </button>
        <button onClick={() => setActiveTab('NODOS')} className="p-2 flex flex-col items-center">
          <div style={{ color: activeTab === 'NODOS' ? colors.sidebar : '#CCC' }}><ExonetLogo size={24} color="currentColor" /></div>
          <span className="text-[8px] font-bold mt-1" style={{ color: activeTab === 'NODOS' ? colors.sidebar : '#CCC' }}>REPARTIDORES</span>
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

function PagosView({ clientes, db }) {
  const [search, setSearch] = useState('');
  const [filtroPago, setFiltroPago] = useState('TODOS');
  const canvasRef = useRef(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [imageGenerated, setImageGenerated] = useState('');
  const [pagoEnBolivares, setPagoEnBolivares] = useState(false);
  
  const [modalForm, setModalForm] = useState({
    montoPagado: '',
    referenciaPago: '',
    fechaPago: '',
    fechaVencimiento: ''
  });

  const clientesDePago = clientes.filter(c => !c.exonerado);

  const filteredClientes = clientesDePago.filter(c => {
    const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase();
    const cumpleBusqueda = nombreCompleto.includes(search.toLowerCase());
    if (!cumpleBusqueda) return false;
    
    const estado = obtenerEstadoCliente(c);
    if (filtroPago === 'PENDIENTES') return estado === 'PENDIENTE' && !esProximoAVencer(c);
    if (filtroPago === 'SALDO_PENDIENTE') {
      if (c.esBolivares) return false;
      const costoTotal = parseFloat(c.costo || 0);
      const abono = parseFloat(c.montoPagado || 0);
      return c.pagoCompletado && abono < costoTotal;
    }
    if (filtroPago === 'VENCER') return esProximoAVencer(c);
    if (filtroPago === 'SOLVENTES') return estado === 'SOLVENTE' && !esProximoAVencer(c);
    return true;
  });

  const openPaymentModal = (cliente) => {
    const fechaPagoInicial = obtenerFechaActualLocal();
    setSelectedCliente(cliente);
    setPagoEnBolivares(false);
    
    const costoBase = parseFloat(cliente.costo || 0);
    setModalForm({
      montoPagado: costoBase.toFixed(3),
      referenciaPago: '',
      fechaPago: fechaPagoInicial,
      fechaVencimiento: calcularVencimientoLocal(fechaPagoInicial)
    });
    setImageGenerated('');
    setShowPaymentModal(true);
  };

  const handleLiquidarSaldoDirecto = async (cliente) => {
    const fechaPagoActual = obtenerFechaActualLocal();
    const vencimientoCalculado = calcularVencimientoLocal(fechaPagoActual);
    const costoTotalNum = parseFloat(cliente.costo || 0);
    const costoTotal = costoTotalNum.toFixed(3);

    if (window.confirm(`¿Deseas registrar la liquidación completa de saldo para ${cliente.nombre} ${cliente.apellido} por un monto total de $${costoTotal} COP?`)) {
      try {
        await updateDoc(doc(db, 'clientes', cliente.id), {
          montoPagado: costoTotal,
          fechaPago: fechaPagoActual,
          fechaVencimiento: vencimientoCalculado,
          pagoCompletado: true
        });
        alert(`¡Servicio de ${cliente.nombre} completamente solventado con éxito!`);
      } catch (err) {
        console.error("Error al liquidar saldo directo:", err);
      }
    }
  };

  const enviarRecordatorioAmigable = (cliente) => {
    const textoMensaje = `¡Hola! ${cliente.nombre} Te saludamos desde el área de atención para tu conexión de internet.⚡\n\nNos encanta acompañarte en tu día a día, por lo que queremos recordarte con un poquito de anticipación que tu fecha de pago se acerca. Queremos asegurarnos de que tu conexión siga activa y estable sin interrupciones. 💻✨\n\nSi tienes alguna duda, ¡aquí estamos para ayudarte!`;
    const numeroLimpio = cliente.telefono.replace(/[^\d]/g, '');
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(textoMensaje)}`;
    window.open(url, '_blank');
  };

  const generarImagenRecibo = (cliente, monto, referencia, fPago, fVenc, enBs) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const costoTotal = parseFloat(cliente.costo || 0);
    const divisaVisual = enBs ? 'Bs' : 'COP';
    
    const montoNum = parseFloat(monto || cliente.costo || 0);
    const abonoVisual = montoNum.toFixed(3);
    const restante = !enBs ? Math.max(0, costoTotal - parseFloat(monto || 0)) : 0;
    
    const esPagoCompleto = enBs || (parseFloat(monto || 0) >= costoTotal);
    
    let canvasHeight = 620;
    if (restante > 0 && !enBs) canvasHeight = 660;
    if (esPagoCompleto) canvasHeight = 580;

    canvas.width = 480;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(0, 0, 480, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'black 32px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('EXONET', 240, 55);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#A3E635';
    ctx.fillText('COMPROBANTE DE PAGO DIGITAL', 240, 85);

    ctx.fillStyle = '#E8F5E9';
    ctx.fillRect(40, 140, 400, 80);
    ctx.strokeStyle = '#C5E1A5';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 140, 400, 80);

    ctx.fillStyle = '#1B5E20';
    ctx.font = '900 34px sans-serif';
    ctx.fillText(`${enBs ? '' : '$'}${abonoVisual} ${divisaVisual}`, 240, 192);

    const drawRow = (label, value, y, valueColor = '#1B5E20') => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#888888';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(label.toUpperCase(), 50, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = valueColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(value, 430, y);
    };
    
    drawRow('Abonado', `${cliente.nombre} ${cliente.apellido}`.toUpperCase(), 260);
    drawRow('Plan Contratado', `${cliente.plan} Mbps ${cliente.ftth ? 'Fibra Óptica' : 'Inalámbrico'}`, 300);
    
    let currentY = 340;
    if (!esPagoCompleto && !enBs) {
      drawRow('Costo Total', `$${costoTotal.toFixed(3)} ${divisaVisual}`, currentY, '#444444');
      currentY += 40;
    }
    
    if (!esPagoCompleto) {
      drawRow('Monto Abonado', `${enBs ? '' : '$'}${abonoVisual} ${divisaVisual}`, currentY, '#1B5E20');
      currentY += 40;
    }
    
    if (restante > 0 && !enBs) {
      drawRow('Falta Restante', `$${restante.toFixed(3)} ${divisaVisual}`, currentY, '#C62828');
      currentY += 40;
    }
    
    drawRow('Fecha de Pago', formatearFechaPantalla(fPago), currentY);
    currentY += 40;
    drawRow('Próximo Vencimiento', formatearFechaPantalla(fVenc), currentY, '#C62828');
    currentY += 40;
    drawRow('Referencia / Pago', referencia || 'EFECTIVO / DIVISAS', currentY, '#444444');
    currentY += 45;

    ctx.strokeStyle = '#2E7D32';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(40, currentY);
    ctx.lineTo(440, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    currentY += 30;
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡Gracias por tu solvencia y preferencia!', 240, currentY);
    
    currentY += 20;
    ctx.font = '900 12px sans-serif';
    ctx.fillStyle = '#2E7D32';
    ctx.fillText('CONEXIÓN ESTABLE SIEMPRE.', 240, currentY);

    setImageGenerated(canvas.toDataURL('image/jpeg'));
  };

  const handleSavePago = async (e) => {
    e.preventDefault();
    if (!selectedCliente) return;

    const parsedMonto = parseFloat(modalForm.montoPagado || 0);
    const montoFinal = parsedMonto.toFixed(3);

    try {
      await updateDoc(doc(db, 'clientes', selectedCliente.id), {
        montoPagado: montoFinal,
        referenciaPago: modalForm.referenciaPago.toUpperCase(),
        fechaPago: modalForm.fechaPago,
        fechaVencimiento: modalForm.fechaVencimiento,
        pagoCompletado: true,
        esBolivares: pagoEnBolivares
      });
      
      generarImagenRecibo(
        selectedCliente, 
        montoFinal, 
        modalForm.referenciaPago.toUpperCase(), 
        modalForm.fechaPago, 
        modalForm.fechaVencimiento,
        pagoEnBolivares
      );
    } catch (err) {
      console.error("Error al registrar el pago técnico:", err);
      alert("Error al guardar registro en la base de datos.");
    }
  };

  const enviarSquareConRecibo = () => {
    if (!selectedCliente) return;
    
    const divisaText = pagoEnBolivares || selectedCliente.esBolivares ? 'Bs' : 'COP';
    const rawAbono = parseFloat(modalForm.montoPagado || selectedCliente.montoPagado || 0);
    const abonoFormateado = rawAbono.toFixed(3);
    const costoTotal = parseFloat(selectedCliente.costo || 0);
    
    let textoMensaje = `*EXONET - NOTIFICACIÓN DE PAGO 🌐*\n\nEstimado(a) ${selectedCliente.nombre} ${selectedCliente.apellido}, tu pago de *${pagoEnBolivares || selectedCliente.esBolivares ? '' : '$'}${abonoFormateado} ${divisaText}* ha sido procesado de manera exitosa.\n\n`;
    
    if (!pagoEnBolivares && !selectedCliente.esBolivares) {
      const restante = Math.max(0, costoTotal - rawAbono);
      if (restante > 0) {
        textoMensaje += `*📊 Resumen de Cuenta:*\n• Costo del Plan: *$${costoTotal.toFixed(3)} ${divisaText}*\n• Abonado Hoy: *$${abonoFormateado} ${divisaText}*\n• Falta Restante: _*$${restante.toFixed(3)} ${divisaText}*_\n⚠️ Por favor, recuerda cubrir el saldo pendiente lo más pronto posible.\n\n`;
      }
    }
    
    textoMensaje += `*📅 Detalles de Cobertura*\n• Fecha de pago: *${formatearFechaPantalla(modalForm.fechaPago || selectedCliente.fechaPago)}*\n• Próximo Vencimiento: *${formatearFechaPantalla(modalForm.fechaVencimiento || selectedCliente.fechaVencimiento)}*\n\n¡Gracias por mantener tu servicio al día! 😉`;
    
    const numeroLimpio = selectedCliente.telefono.replace(/[^\d]/g, '');
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(textoMensaje)}`;
    window.open(url, '_blank');
  };

  const handleClearPagoStatus = async (cliente) => {
    if (window.confirm(`¿Deseas restablecer y poner como PENDIENTE a ${cliente.nombre} ${cliente.apellido}?`)) {
      try {
        await updateDoc(doc(db, 'clientes', cliente.id), {
          fechaVencimiento: '',
          fechaPago: '',
          referenciaPago: '',
          montoPagado: '',
          pagoCompletado: false,
          esBolivares: false
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-between items-center mb-8">
        <h2 style={{ color: colors.textMain }} className="text-3xl font-black uppercase">Control de Vencimientos y Pagos</h2>
      </div>

      <div className="bg-white mb-6 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input 
          placeholder="Buscar cliente por nombre o apellido..." 
          className="bg-transparent w-full p-4 outline-none font-medium" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-green-50 overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[10px] font-black text-green-800 tracking-widest uppercase">Listado de Coberturas Técnicas</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button 
                onClick={() => setFiltroPago('TODOS')} 
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${filtroPago === 'TODOS' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Todos ({clientesDePago.length})
              </button>
              <button 
                onClick={() => setFiltroPago('PENDIENTES')} 
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${filtroPago === 'PENDIENTES' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-red-500'}`}
              >
                Vencidos ({clientesDePago.filter(c => obtenerEstadoCliente(c) === 'PENDIENTE' && !esProximoAVencer(c)).length})
              </button>
              <button 
                onClick={() => setFiltroPago('SALDO_PENDIENTE')} 
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${filtroPago === 'SALDO_PENDIENTE' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-400 hover:text-amber-500'}`}
              >
                Saldo Pendiente ({clientesDePago.filter(c => !c.esBolivares && c.pagoCompletado && parseFloat(c.montoPagado || 0) < parseFloat(c.costo || 0)).length})
              </button>
              <button 
                onClick={() => setFiltroPago('VENCER')} 
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${filtroPago === 'VENCER' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-orange-500'}`}
              >
                A Vencer ({clientesDePago.filter(c => esProximoAVencer(c)).length})
              </button>
              <button 
                onClick={() => setFiltroPago('SOLVENTES')} 
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${filtroPago === 'SOLVENTES' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:text-green-600'}`}
              >
                Solventes ({clientesDePago.filter(c => obtenerEstadoCliente(c) === 'SOLVENTE' && !esProximoAVencer(c)).length})
              </button>
            </div>
            <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-bold">
              {clientesDePago.filter(c => obtenerEstadoCliente(c) === 'SOLVENTE').length} / {clientesDePago.length} AL DÍA
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredClientes.map((c, index) => {
            const estadoActual = obtenerEstadoCliente(c);
            const proximo = esProximoAVencer(c);
            
            const costoTotal = parseFloat(c.costo || 0);
            const abono = parseFloat(c.montoPagado || 0);
            
            const abonoVisualPantalla = c.montoPagado ? parseFloat(c.montoPagado).toFixed(3) : '0.000';
            const divisaSimbolo = c.esBolivares ? 'Bs' : 'COP';
            
            const tieneDeudaActiva = !c.esBolivares && c.pagoCompletado && abono < costoTotal;
            const faltante = tieneDeudaActiva ? Math.max(0, costoTotal - abono) : 0;

            return (
              <div key={c.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-green-50/30 transition-colors gap-4">
                <div className="flex items-center gap-5">
                  <span className="text-gray-300 font-black text-xl">{index + 1}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-gray-800 uppercase leading-none">{c.nombre} {c.apellido}</h3>
                      {c.ftth && (
                        <span className="bg-blue-100 text-blue-700 font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider">
                          FIBRA
                        </span>
                      )}
                      {c.prestamo && (
                        <span className="bg-orange-100 text-orange-700 font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider">
                          PRÉSTAMO
                        </span>
                      )}
                      {proximo && (
                        <span className="bg-orange-100 text-orange-700 font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider animate-pulse flex items-center gap-1">
                          <Clock size={10}/> PRÓXIMO A VENCER
                        </span>
                      )}
                      {tieneDeudaActiva && (
                        <span className="bg-red-100 text-red-700 font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider">
                          CON SALDO PENDIENTE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 font-bold mt-1 uppercase flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>Plan: <span className="text-green-700 font-black">{c.plan} Mbps</span></span>
                      <span>|</span>
                      {!c.esBolivares && <span>Costo: <span className="text-gray-700 font-black">${costoTotal.toFixed(3)} COP</span></span>}
                      {c.pagoCompletado && (
                        <>
                          <span>|</span>
                          <span>Abonó: <span className="text-blue-700 font-black">{c.esBolivares ? '' : '$'}{abonoVisualPantalla} {divisaSimbolo}</span></span>
                        </>
                      )}
                      {faltante > 0 && (
                        <>
                          <span>|</span>
                          <span className="text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded">
                            Faltan: ${faltante.toFixed(3)} COP Restantes
                          </span>
                        </>
                      )}
                      {c.fechaVencimiento && (
                        <>
                          <span>|</span>
                          <span className="text-gray-600 font-bold">
                            Vence el: {formatearFechaPantalla(c.fechaVencimiento)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  {proximo && c.telefono && (
                    <button
                      onClick={() => enviarRecordatorioAmigable(c)}
                      className="px-3 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black"
                      title="Enviar Recordatorio Amigable por WhatsApp"
                    >
                      <MessageCircle size={16} className="text-green-500 fill-green-500" />
                      <span>AVISAR</span>
                    </button>
                  )}

                  {tieneDeudaActiva && (
                    <button
                      onClick={() => handleLiquidarSaldoDirecto(c)}
                      className="px-3 py-2.5 bg-orange-500 hover:bg-orange-600 text-white shadow-sm rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black uppercase"
                      title="Poner Pago Completo (Liquidar los restantes)"
                    >
                      <RefreshCw size={14} className="animate-spin-slow" />
                      <span>PAGO COMPLETO</span>
                    </button>
                  )}

                  {estadoActual === 'SOLVENTE' && (
                    <button
                      onClick={() => {
                        setSelectedCliente(c);
                        setPagoEnBolivares(c.esBolivares || false);
                        const abonoBase = c.montoPagado ? parseFloat(c.montoPagado).toFixed(3) : '';
                        setModalForm({
                          montoPagado: abonoBase,
                          referenciaPago: c.referenciaPago || '',
                          fechaPago: c.fechaPago || obtenerFechaActualLocal(),
                          fechaVencimiento: c.fechaVencimiento || calcularVencimientoLocal(c.fechaPago || obtenerFechaActualLocal())
                        });
                        setShowPaymentModal(true);
                        setTimeout(() => {
                          generarImagenRecibo(c, c.montoPagado, c.referenciaPago, c.fechaPago || obtenerFechaActualLocal(), c.fechaVencimiento, c.esBolivares);
                        }, 250);
                      }}
                      className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-1.5 text-xs font-black"
                      title="Ver Recibo Digital de Imagen"
                    >
                      <FileText size={15} />
                      <span>VER RECIBO</span>
                    </button>
                  )}

                  {estadoActual === 'SOLVENTE' ? (
                    <button
                      onClick={() => handleClearPagoStatus(c)}
                      className="px-4 py-2.5 bg-green-600 text-white border border-green-600 shadow-md rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-black uppercase"
                    >
                      <CheckSquare size={16} />
                      <span>SOLVENTE</span>
                    </button>
                  ) : !tieneDeudaActiva ? (
                    <button
                      onClick={() => openPaymentModal(c)}
                      className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-black uppercase"
                    >
                      <Square size={16} />
                      <span>REGISTRAR PAGO</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {filteredClientes.length === 0 && (
            <div className="p-20 text-center">
              <DollarSign size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold italic">No se encontraron registros activos para este filtro.</p>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative border border-green-100 my-8">
            <button 
              onClick={() => { setShowPaymentModal(false); setSelectedCliente(null); setImageGenerated(''); }}
              className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mb-4">
              <span className="text-[10px] font-black text-green-700 tracking-widest uppercase block mb-1">PROCESO DE COBRANZA</span>
              <h3 className="text-xl font-black text-gray-800 uppercase leading-tight">
                {selectedCliente.nombre} {selectedCliente.apellido}
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                Plan base asignado: {selectedCliente.plan} Mbps - ${parseFloat(selectedCliente.costo || 0).toFixed(3)} COP
              </p>
            </div>

            {!imageGenerated ? (
              <form onSubmit={handleSavePago} className="space-y-4">
                
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border rounded-xl select-none">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-700 uppercase">Pago en bolívares (Bs)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={pagoEnBolivares} 
                      onChange={(e) => {
                        const checkState = e.target.checked;
                        setPagoEnBolivares(checkState);
                        if (!checkState) {
                          const costoBase = parseFloat(selectedCliente.costo || 0);
                          setModalForm({ ...modalForm, montoPagado: costoBase.toFixed(3) });
                        } else {
                          setModalForm({ ...modalForm, montoPagado: '' });
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase px-1">Monto Recibido ({pagoEnBolivares ? 'Bs' : '$ COP'})</label>
                  <div className="relative flex items-center">
                    <DollarSign size={16} className="absolute left-4 text-gray-400" />
                    <input 
                      type="text" 
                      inputMode="decimal"
                      required
                      placeholder="Ej. 50.000"
                      className="w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl border font-bold text-gray-800 outline-none focus:border-green-500"
                      value={modalForm.montoPagado}
                      onChange={e => setModalForm({...modalForm, montoPagado: e.target.value})}
                    />
                  </div>
                  {!pagoEnBolivares && modalForm.montoPagado && parseFloat(selectedCliente.costo) - parseFloat(modalForm.montoPagado) > 0 && (
                    <span className="text-xs text-red-600 font-bold px-1 mt-0.5">
                      ⚠️ Se registrará una deuda restante de: ${(parseFloat(selectedCliente.costo) - parseFloat(modalForm.montoPagado)).toFixed(3)} COP
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase px-1">Referencia o Transacción</label>
                  <input 
                    type="text" 
                    placeholder="pago móvil / efectivo"
                    className="w-full bg-gray-50 px-4 py-3.5 rounded-xl border font-bold text-gray-800 focus:border-green-500 outline-none"
                    value={modalForm.referenciaPago}
                    onChange={e => setModalForm({...modalForm, referenciaPago: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase px-1">Fecha de Activación / Pago</label>
                  <div className="relative flex items-center">
                    <Calendar size={16} className="absolute left-4 text-gray-400" />
                    <input 
                      type="date" 
                      required
                      className="w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl border font-bold text-gray-800 focus:border-green-500 outline-none"
                      value={modalForm.fechaPago}
                      onChange={e => {
                        const nuevaFechaPago = e.target.value;
                        setModalForm({
                          ...modalForm,
                          fechaPago: nuevaFechaPago,
                          fechaVencimiento: calcularVencimientoLocal(nuevaFechaPago)
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase px-1">Fecha de Suspensión / Vencimiento</label>
                  <div className="relative flex items-center">
                    <Calendar size={16} className="absolute left-4 text-gray-400" />
                    <input 
                      type="date" 
                      required
                      className="w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl border font-bold text-gray-800 focus:border-green-500 outline-none"
                      value={modalForm.fechaVencimiento}
                      onChange={e => setModalForm({...modalForm, fechaVencimiento: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  style={{ backgroundColor: colors.sidebar }} 
                  className="w-full py-4 text-white font-black text-sm rounded-xl shadow-lg uppercase tracking-wider mt-2 active:scale-95 transition-transform"
                >
                  PROCESAR Y GENERAR IMAGEN
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
                <p className="text-xs text-gray-500 font-bold uppercase">¡Imagen generada con éxito! Haz clic prolongado o clic derecho para guardarla / copiarla.</p>
                
                <div className="border rounded-2xl overflow-hidden shadow-inner max-w-xs mx-auto bg-gray-100">
                  <img src={imageGenerated} alt="Recibo Digital Exonet" className="w-full h-auto object-contain mx-auto" />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={enviarSquareConRecibo}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl shadow-md uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <MessageCircle size={18} />
                    <span>ENVIAR FACTURA POR WHATSAPP</span>
                  </button>

                  <a 
                    href={imageGenerated} 
                    download={`Recibo_Exonet_${selectedCliente.nombre}_${selectedCliente.apellido}.jpg`}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl uppercase tracking-wider block"
                  >
                    Descargar en Dispositivo
                  </a>

                  <button
                    onClick={() => { setShowPaymentModal(false); setSelectedCliente(null); setImageGenerated(''); }}
                    className="text-xs text-gray-400 font-bold uppercase hover:underline mt-2"
                  >
                    Cerrar ventana de caja
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- CONFIGURACIÓN DE PESTAÑA EQUIPOS ---
function ItemManagementView({ clientes, db }) {
  const [subTab, setSubTab] = useState('INALAMBRICOS');

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex bg-white/80 p-1.5 rounded-2xl border border-green-100 mb-6 max-w-xl mx-auto gap-2 shadow-sm">
        <button 
          onClick={() => setSubTab('INALAMBRICOS')}
          className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-green-700 text-white shadow-md"
          style={subTab !== 'INALAMBRICOS' ? {backgroundColor: 'transparent', color: colors.sidebar} : {}}
        >
          [ Equipos a préstamo ]
        </button>
        <button 
          onClick={() => setSubTab('FTTH')}
          className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-green-700 text-white shadow-md"
          style={subTab !== 'FTTH' ? {backgroundColor: 'transparent', color: colors.sidebar} : {}}
        >
          [ Fibra (FTTH) ]
        </button>
      </div>

      {subTab === 'INALAMBRICOS' ? (
        <PrestamosView clientes={clientes} db={db} />
      ) : (
        <FtthView clientes={clientes} db={db} />
      )}
    </div>
  );
}

function PrestamosView({ clientes, db }) {
  const [search, setSearch] = useState('');

  const enPrestamo = clientes
    .filter(c => c.prestamo === true)
    .filter(c => `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const handleWhatsApp = (cliente, customMsg = null, directToNumber = false) => {
    const defaultMsg = `Hola, ${cliente.nombre} 😊. Te saludamos de parte de EXONET, tu conexión a internet.\n\nPasamos por aquí para recordarte que la fecha de tu pago ha vencido. Nuestra prioridad es que sigas disfrutando de nuestro servicio sin interrupciones.\n\n¡Gracias por tu preferencia! 🌐`;
    const mensaje = customMsg || defaultMsg;
    
    const url = directToNumber 
      ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
      
    window.open(url, '_blank');
  };

  const handleCycleStatus = async (cliente) => {
    const estados = ['ACTIVO', 'REVISIÓN', 'PENDIENTE DE RETIRAR'];
    const currentIdx = estados.indexOf(cliente.estadoPrestamo || 'ACTIVO');
    const nextStatus = estados[(currentIdx + 1) % estados.length];
    
    try {
      await updateDoc(doc(db, 'clientes', cliente.id), { 
        estadoPrestamo: nextStatus
      });
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ color: colors.textMain }} className="text-3xl font-black uppercase">Equipos de Préstamo</h2>
        <button 
          onClick={() => handlePrintGeneral('LISTA DE EQUIPOS A PRÉSTAMO', enPrestamo)}
          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-200 transition-colors shadow-sm"
        >
          <Printer size={18} /> IMPRIMIR LISTA
        </button>
      </div>
      
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
           <span className="text-[10px] font-black text-green-800 tracking-widest uppercase">Clientes con Equipos a Préstamo</span>
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
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                
                {c.estadoPrestamo === 'PENDIENTE DE RETIRAR' && (
                  <button 
                    onClick={() => handleWhatsApp(c, `Orden de Retiro EXONET: Se ha programado el retiro de equipos para el cliente ${c.nombre} ${c.apellido}.\n📍 Dirección: ${c.direccion}.`, false)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
                    title="Reportar Retiro"
                  >
                    <Wrench size={18} />
                    <span className="text-[9px] font-black hidden lg:block">REPORTAR RETIRO</span>
                  </button>
                )}

                {c.estadoPrestamo === 'REVISIÓN' && (
                  <button 
                    onClick={() => handleWhatsApp(c, `Soporte EXONET: Chequeo de equipos para ${c.nombre} ${c.apellido}.\n📍 Dirección: ${c.direccion}.\nPor favor, revisen si hay algún problema y reporten las novedades.`, false)}
                    className="p-2 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors flex items-center gap-2"
                    title="Mandar a Revisión"
                  >
                    <AlertCircle size={18} />
                    <span className="text-[9px] font-black hidden lg:block">REVISIÓN TÉCNICA</span>
                  </button>
                )}

                <button 
                  onClick={() => handleWhatsApp(c, null, true)}
                  className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                  title="Enviar recordatorio estándar (Cobro)"
                >
                  <MessageCircle size={20} />
                </button>

                <div 
                  onClick={() => handleCycleStatus(c)}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all select-none ${getStatusStyles(c.estadoPrestamo || 'ACTIVO')}`}
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
          {enPrestamo.length === 0 && (
            <div className="p-20 text-center">
              <Laptop size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold italic">No hay resultados que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- CONFIGURACIÓN DE PESTAÑA FIBRA ---
function FtthView({ clientes, db }) {
  const [search, setSearch] = useState('');

  const clientesFtth = clientes
    .filter(c => c.ftth === true)
    .filter(c => `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const handleWhatsApp = (cliente, customMsg = null, directToNumber = false) => {
    const defaultMsg = `Hola, ${cliente.nombre} 😊. Te saludamos desde el área de atención para tu conexión de internet.\n\nPasamos por aquí para recordarte que la fecha de tu pago ha vencido. Nuestra prioridad es que sigas disfrutando de la máxima estabilidad y velocidad de tu plan de fibra óptica sin interrupciones. 🚀\n\n¡Feliz día y gracias por tu preferencia!`;
    const mensaje = customMsg || defaultMsg;
    
    const url = directToNumber 
      ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
      
    window.open(url, '_blank');
  };

  const handleCycleStatus = async (cliente) => {
    const estados = ['ACTIVO', 'REVISIÓN', 'PENDIENTE DE RETIRAR'];
    const currentIdx = estados.indexOf(cliente.estadoFTTH || 'ACTIVO');
    const nextStatus = estados[(currentIdx + 1) % estados.length];
    
    try {
      await updateDoc(doc(db, 'clientes', cliente.id), { 
        estadoFTTH: nextStatus
      });
    } catch (err) {
      console.error("Error al actualizar estado FTTH:", err);
    }
  };

  const getDynamicStatus = (cliente) => {
    const estadoPago = obtenerEstadoCliente(cliente);
    if (estadoPago === 'PENDIENTE') return 'SIN SERVICIO';
    return cliente.estadoFTTH || 'ACTIVO';
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'SIN SERVICIO':
        return 'bg-red-600 text-white border-red-600 shadow-sm font-black';
      case 'PENDIENTE DE RETIRAR':
        return 'bg-red-50 text-red-600 border-red-100 font-bold';
      case 'REVISIÓN':
        return 'bg-orange-50 text-orange-600 border-orange-100 font-bold';
      default:
        return 'bg-green-50 text-green-600 border-green-100 font-bold';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ color: colors.textMain }} className="text-3xl font-black uppercase">Equipos de Fibra (FTTH)</h2>
        <button 
          onClick={() => handlePrintGeneral('LISTA DE EQUIPOS FTTH (FIBRA)', clientesFtth)}
          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-200 transition-colors shadow-sm"
        >
          <Printer size={18} /> IMPRIMIR LISTA
        </button>
      </div>
      
      <div className="bg-white mb-6 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input 
          placeholder="Buscar cliente con fibra óptica..." 
          className="bg-transparent w-full p-4 outline-none font-medium" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-green-50 overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b flex justify-between items-center">
           <span className="text-[10px] font-black text-green-800 tracking-widest uppercase">Clientes con Equipos FTTH</span>
           <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-bold">{clientesFtth.length} EQUIPOS FTTH</span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {clientesFtth.map((c, index) => {
            const estadoActual = getDynamicStatus(c);
            const estadoPago = obtenerEstadoCliente(c);
            const divisaSimbolo = c.esBolivares ? 'Bs' : 'COP';
            
            const abonoNum = parseFloat(c.montoPagado || c.costo || 0);
            const costoAMostrar = estadoPago === 'SOLVENTE' ? (c.esBolivares ? `${abonoNum.toFixed(3)} Bs` : `$${abonoNum.toFixed(3)} COP`) : '$0.000';

            return (
              <div 
                key={c.id} 
                className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors gap-4 ${
                  estadoPago === 'PENDIENTE' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-green-50/30'
                }`}
              >
                <div className="flex items-center gap-5">
                  <span className="text-gray-300 font-black text-xl">{index + 1}</span>
                  <div>
                    <h3 className="font-black text-gray-800 uppercase leading-none">{c.nombre} {c.apellido}</h3>
                    <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase flex items-center gap-1">
                      <MapPin size={10}/> {c.direccion}
                    </p>
                    <p className="text-[10px] font-black text-green-800 uppercase mt-1">
                      Monto Reportado: <span className={estadoPago === 'SOLVENTE' ? 'text-green-700' : 'text-red-600'}>{costoAMostrar}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  
                  {c.estadoFTTH === 'PENDIENTE DE RETIRAR' && (
                    <button 
                      onClick={() => handleWhatsApp(c, `Orden de Retiro: Equipos de Fibra (FTTH) \n👤 Cliente: ${c.nombre} ${c.apellido}\n📍 Dirección: ${c.direccion}\n⚠️ Nota para el técnico: Hay que desconectar y traerse el módem de fibra (ONU), su cargador y los accesorios que se usaron para instalarlo.`, false)}
                      className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
                      title="Reportar Retiro"
                    >
                      <Wrench size={18} />
                      <span className="text-[9px] font-black hidden lg:block">REPORTAR RETIRO</span>
                    </button>
                  )}

                  {c.estadoFTTH === 'REVISIÓN' && (
                    <button 
                      onClick={() => handleWhatsApp(c, `🛠️ Soporte FTTH: Revisión de Fibra y Equipos\n👤 Cliente: ${c.nombre} ${c.apellido}\n📍 Dirección: ${c.direccion}\n📋 ¿Qué hacer?: Por favor, vayan a revisar el cable de fibra, midan cómo está llegando la señal y chequeen si el módem (ONU) está funcionando bien. Si hay alguna falla o la señal está muy alta, avisen de inmediato, por favor.`, false)}
                      className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors flex items-center gap-2"
                      title="Mandar a Revisión"
                    >
                      <AlertCircle size={18} />
                      <span className="text-[9px] font-black hidden lg:block">REVISIÓN TÉCNICA</span>
                    </button>
                  )}

                  <button 
                    onClick={() => handleWhatsApp(c, null, true)}
                    className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                    title="Enviar recordatorio estándar FTTH (Cobro)"
                  >
                    <MessageCircle size={20} />
                  </button>

                  <div 
                    onClick={() => {
                      if (estadoPago === 'SOLVENTE') {
                        handleCycleStatus(c);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all select-none ${
                      estadoPago === 'SOLVENTE' ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'
                    } ${getStatusStyles(estadoActual)}`}
                  >
                    <CheckSquare size={14} />
                    <span className="text-[10px] font-black">{estadoActual}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {clientesFtth.length === 0 && (
            <div className="p-20 text-center">
              <Laptop size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold italic">No hay resultados en la sección de Fibra Óptica.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- VISTA GENERAL DE CLIENTES ---
function ClientesView({ clientes, nodos, db }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('DE_PAGO');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    nombre: '', apellido: '', direccion: '', plan: '', telefono: '', 
    costo: '', ip: '', señal: '', señalRemota: '', ap: '', prestamo: false, ftth: false,
    estadoPrestamo: 'ACTIVO', estadoFTTH: 'ACTIVO', pagoCompletado: false, exonerado: false,
    fechaPago: '', fechaVencimiento: '', montoPagado: '', referenciaPago: '', esBolivares: false
  });

  const filtered = clientes.filter(c => {
    const nombreCompleto = `${c.nombre} ${c.apellido} ${c.ip}`.toLowerCase();
    const cumpleBusqueda = nombreCompleto.includes(search.toLowerCase());
    if (!cumpleBusqueda) return false;

    if (filtroRapido === 'DE_PAGO') return !c.exonerado;
    if (filtroRapido === 'EXONERADOS') return c.exonerado;
    return true;
  });

  const totalDePago = clientes.filter(c => !c.exonerado).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ap) {
      alert("Por favor, selecciona un Nodo antes de guardar.");
      return;
    }

    const finalCosto = formData.costo ? parseFloat(formData.costo.trim()).toFixed(3) : '';
    const esExoneradoAutomatico = finalCosto === '' || parseFloat(finalCosto) === 0;

    const datosFinales = {
      ...formData,
      costo: finalCosto,
      exonerado: esExoneradoAutomatico
    };
    
    try {
      if (editingId) await setDoc(doc(db, 'clientes', editingId), datosFinales);
      else await addDoc(collection(db, 'clientes'), { ...datosFinales, createdAt: Date.now() });
      setShowForm(false); setEditingId(null);
      setFormData({ nombre: '', apellido: '', direccion: '', plan: '', telefono: '', costo: '', ip: '', señal: '', señalRemota: '', ap: '', prestamo: false, ftth: false, estadoPrestamo: 'ACTIVO', estadoFTTH: 'ACTIVO', pagoCompletado: false, exonerado: false, fechaPago: '', fechaVencimiento: '', montoPagado: '', referenciaPago: '', esBolivares: false });
    } catch (err) {
      alert("Error de permisos: Tu cuenta no está autorizada para guardar datos.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h2 style={{ color: colors.textMain }} className="text-3xl font-black tracking-tight">GESTIÓN DE CLIENTES</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handlePrintClientesFiltrados(clientes)}
            className="bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all"
          >
            <Printer size={20} /> IMPRIMIR LISTA
          </button>
          <button onClick={() => setShowForm(true)} style={{ backgroundColor: colors.sidebar }} className="text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg">+ NUEVO CLIENTE</button>
        </div>
      </div>
      
      <div className="bg-white mb-4 rounded-2xl flex items-center px-6 shadow-sm border border-green-100">
        <Search size={20} className="text-gray-400" />
        <input placeholder="Buscar abonado por nombre o apellido..." className="bg-transparent w-full p-4 outline-none font-medium" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex bg-white/60 p-1.5 rounded-2xl border border-green-100 mb-6 max-w-md gap-1">
        <button 
          onClick={() => setFiltroRapido('TODOS')}
          className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-transparent text-green-800 hover:bg-green-100/50"
          style={filtroRapido === 'TODOS' ? {backgroundColor: colors.sidebar, color: '#fff'} : {}}
        >
          [ Todos ({clientes.length}) ]
        </button>
        <button 
          onClick={() => setFiltroRapido('DE_PAGO')}
          className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-transparent text-green-800 hover:bg-green-100/50"
          style={filtroRapido === 'DE_PAGO' ? {backgroundColor: colors.sidebar, color: '#fff'} : {}}
        >
          [ Clientes De Pago ({totalDePago}) ]
        </button>
        <button 
          onClick={() => setFiltroRapido('EXONERADOS')}
          className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-transparent text-green-800 hover:bg-green-100/50"
          style={filtroRapido === 'EXONERADOS' ? {backgroundColor: colors.sidebar, color: '#fff'} : {}}
        >
          [ Exonerados ({clientes.filter(c => c.exonerado).length}) ]
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map(c => {
          const costoTotal = parseFloat(c.costo || 0);
          const abono = parseFloat(c.montoPagado || 0);
          const estadoActual = obtenerEstadoCliente(c);
          const divisaSimbolo = c.esBolivares ? 'Bs' : 'COP';
          const faltante = estadoActual === 'SOLVENTE' && !c.esBolivares ? Math.max(0, costoTotal - abono) : 0;
          const abonoVisualPantalla = c.montoPagado ? parseFloat(c.montoPagado).toFixed(3) : '0.000';

          return (
            <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-white hover:border-green-200 flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center">
              <div className="col-span-3 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 style={{ color: colors.textMain }} className="font-bold text-lg leading-tight uppercase">{c.nombre} {c.apellido}</h3>
                  {c.exonerado && (
                    <span className="bg-blue-100 text-blue-700 font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1">
                      <Gift size={10} /> EXONERADO
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium"><MapPin size={12}/> {c.direccion}</p>
                {c.prestamo && <p className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-1">EQUIPO A PRÉSTAMO</p>}
                {c.ftth && <p className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">FIBRA ÓPTICA (FTTH)</p>}
              </div>
              <div className="col-span-2 w-full text-center">
                <span style={{ backgroundColor: colors.bg, color: colors.textMain }} className="text-[10px] px-2 py-1 rounded-md font-bold inline-block mb-1">{c.ap}</span>
                <a href={`http://${c.ip}`} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-green-700 hover:underline flex items-center justify-center gap-1">{c.ip} <ExternalLink size={10} /></a>
              </div>
              <div className="col-span-2 w-full text-center">
                <span style={{ color: colors.primary }} className="font-black italic block">{c.plan} Mbps</span>
                <span className="font-bold text-gray-800 text-sm block">
                  {c.exonerado ? '$0.000 (Cortesía)' : (c.esBolivares ? `${abonoVisualPantalla} ${divisaSimbolo}` : `$${costoTotal.toFixed(3)} ${divisaSimbolo}`)}
                </span>
                {faltante > 0 && (
                  <span className="text-[10px] text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    Faltan: ${faltante.toFixed(3)} {divisaSimbolo}
                  </span>
                )}
                {c.fechaVencimiento && !c.exonerado && (
                  <span className="text-[9px] font-black text-red-600 bg-red-50 px-1 rounded inline-block mt-1">
                    Vence: {formatearFechaPantalla(c.fechaVencimiento)}
                  </span>
                )}
              </div>
              <div className="col-span-2 w-full text-center">
                <div className="flex flex-col items-center">
                   <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase tracking-tighter"><span>LOCAL</span><span>REMOTA</span></div>
                   <div className="flex items-baseline justify-center gap-1 font-black text-gray-700 text-lg tracking-tighter">
                     <span>{c.señal || '0'}</span><span className="text-gray-300 mx-0.5">/</span><span>{c.señalRemota || '0'}</span>
                     <span className="text-[10px] text-gray-400 ml-1 font-bold">dBm</span>
                   </div>
                </div>
              </div>
              
              <div className="col-span-2 w-full flex flex-col items-center gap-1.5 min-w-[160px]">
                {c.telefono && c.telefono.trim() !== "" ? (
                  c.telefono.split(/[\s,]+/).map((num, idx) => {
                    const cleanNum = num.replace(/[^\d+]/g, '');
                    if (!cleanNum) return null;
                    return (
                      <div key={idx} className="flex items-center justify-between w-full bg-gray-50 px-3 py-2 rounded-xl border border-transparent hover:border-green-200 transition-all group">
                        <span className="text-gray-600 font-black text-[11px] tracking-tight font-mono">{num.trim()}</span>
                        <div className="flex gap-3 border-l border-gray-200 pl-3 ml-2">
                          <a href={`tel:${cleanNum}`} className="text-blue-500 hover:scale-125 transition-transform" title="Llamar">
                            <Phone size={18} strokeWidth={2.5} />
                          </a>
                          <a href={`https://wa.me/${cleanNum.replace('+', '')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:scale-125 transition-transform" title="WhatsApp">
                            <MessageCircle size={18} strokeWidth={2.5} />
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full bg-gray-50/50 px-3 py-2 rounded-xl border border-dashed border-gray-200 text-center">
                    <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">Sin contacto</span>
                  </div>
                )}
              </div>

              <div className="col-span-1 flex justify-center gap-2">
                <button onClick={() => { setFormData({ ...c }); setEditingId(c.id); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Pencil size={18} /></button>
                <button 
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar al abonado ${c.nombre} ${c.apellido}?`)) {
                      deleteDoc(doc(db, 'clientes', c.id));
                    }
                  }} 
                  className="p-2 bg-red-50 text-red-500 rounded-xl"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white p-20 text-center rounded-2xl border">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold italic">No hay abonados en esta categoría para mostrar.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[95vh]">
            <h2 style={{ color: colors.textMain }} className="text-2xl font-black uppercase mb-8">Datos del cliente</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input placeholder="Nombre" className="bg-gray-50 p-4 rounded-xl border" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
              <input placeholder="Apellido" className="bg-gray-50 p-4 rounded-xl border" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} />
              <input placeholder="Dirección" className="md:col-span-2 bg-gray-50 p-4 rounded-xl border" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              <input placeholder="Plan (Mbps)" type="text" inputMode="numeric" className="bg-gray-50 p-4 rounded-xl border" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} />
              
              <input 
                placeholder="Costo ($)" 
                type="text" 
                inputMode="decimal" 
                className="bg-gray-50 p-4 rounded-xl border" 
                value={formData.costo} 
                onChange={e => setFormData({...formData, costo: e.target.value})} 
              />
              
              <input 
                placeholder="IP" 
                type="text"
                inputMode="decimal"
                className="bg-gray-50 p-4 rounded-xl border font-mono" 
                value={formData.ip} 
                onChange={e => setFormData({...formData, ip: e.target.value})} 
              />
              
              <select 
                required 
                className="bg-gray-50 p-4 rounded-xl border focus:border-green-500 outline-none" 
                value={formData.ap} 
                onChange={e => setFormData({...formData, ap: e.target.value})}
              >
                <option value="">-- SELECCIONAR NODO (OBLIGATORIO) --</option>
                {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
              </select>

              <input placeholder="Teléfono" type="text" inputMode="tel" className="bg-gray-50 p-4 rounded-xl border" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              <div className="flex gap-2">
                <input 
                  placeholder="Señal Local" 
                  type="text"
                  inputMode="decimal"
                  className="w-1/2 bg-gray-50 p-4 rounded-xl border" 
                  value={formData.señal} 
                  onChange={e => setFormData({...formData, señal: e.target.value})} 
                />
                <input 
                  placeholder="Señal Remota" 
                  type="text"
                  inputMode="decimal"
                  className="w-1/2 bg-gray-50 p-4 rounded-xl border" 
                  value={formData.señalRemota} 
                  onChange={e => setFormData({...formData, señalRemota: e.target.value})} 
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setFormData({...formData, prestamo: !formData.prestamo, ftth: false})} 
                  className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100 cursor-pointer select-none"
                >
                  {formData.prestamo ? <CheckSquare className="text-orange-600" /> : <Square className="text-gray-300" />}
                  <span className="font-bold text-gray-700 text-sm">Equipos a préstamo</span>
                </div>

                <div 
                  onClick={() => setFormData({...formData, ftth: !formData.ftth, prestamo: false})} 
                  className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 cursor-pointer select-none"
                >
                  {formData.ftth ? <CheckSquare className="text-blue-600" /> : <Square className="text-gray-300" />}
                  <span className="font-bold text-gray-700 text-sm">FTTH (Fibra Óptica)</span>
                </div>
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

// --- CONFIGURACIÓN DE PESTAÑA NODOS (REPARTIDORES) ---
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
    const encabezadoMes = obtenerEncabezadoMesActual();
    const html = `
      <html>
        <head>
          <title>Exonet - Lista de Clientes - ${nodo.nombre} - ${encabezadoMes}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px; }
            .info { margin-bottom: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f4f4f4; text-align: left; padding: 12px; border: 1px solid #ddd; }
            td { padding: 12px; border: 1px solid #ddd; font-size: 14px; }
            .prestamo { color: #e67e22; font-weight: bold; }
            .ftth { color: #2980b9; font-weight: bold; }
            .sig-container { display: flex; flex-direction: column; align-items: center; }
            .sig-labels { font-size: 8px; color: #999; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
            .sig-values { font-weight: 900; font-size: 16px; letter-spacing: -1px; }
            .sig-values span { color: #ddd; margin: 0 4px; font-weight: normal; }
          </style>
        </head>
        <body>
          <h1>EXONET - ${nodo.nombre} (${encabezadoMes})</h1>
          <div class="info">
            <p>IP REPARTIDOR: ${nodo.ip} | FRECUENCIA: ${nodo.frecuencia} MHz</p>
            <p>TOTAL CLIENTES: ${clientesNodo.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>IP</th>
                <th>PLAN</th>
                <th>SEÑAL</th>
                <th>TELÉFONO</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              ${clientesNodo.map(c => `
                <tr>
                  <td style="text-transform: uppercase;">${c.nombre} ${c.apellido}</td>
                  <td>${c.ip}</td>
                  <td>${c.plan} Mbps</td>
                  <td>
                    <div class="sig-container">
                      <div class="sig-labels">LOCAL REMOTA</div>
                      <div class="sig-values">${c.señal || '0'}<span>/</span>${c.señalRemota || '0'} <small style="font-size: 10px; color: #999;">dBm</small></div>
                    </div>
                  </td>
                  <td>${c.telefono}</td>
                  <td>${c.prestamo ? '<span class="prestamo">PRÉSTAMO</span>' : c.ftth ? '<span class="ftth">FTTH</span>' : ''}</td>
                </tr>
              `).join('')}
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
        <input placeholder="Nombre Repartidor" className="bg-gray-50 p-4 rounded-xl flex-1 border font-bold" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value.toUpperCase()})} />
        <input placeholder="IP" inputMode="decimal" className="bg-gray-50 p-4 rounded-xl border font-mono w-40" value={nuevo.ip} onChange={e => setNuevo({...nuevo, ip: e.target.value})} />
        <input placeholder="Frecuencia (MHz)" inputMode="numeric" className="bg-gray-50 p-4 rounded-xl border w-40" value={nuevo.frecuencia} onChange={e => setNuevo({...nuevo, frecuencia: e.target.value})} />
        <button onClick={handleAdd} style={{ backgroundColor: colors.sidebar }} className="text-white px-8 py-4 rounded-xl font-bold">AÑADIR</button>
      </div>
      <div className="grid grid-cols-1 gap-8">
        {nodos.map(n => {
          const clientesNodo = clientes.filter(c => c.ap === n.nombre);
          return (
            <div key={n.id} className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">{n.nombre}</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{n.frecuencia} MHz</span>
                  </div>
                  <a href={`http://${n.ip}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-gray-400 mt-1 hover:text-green-600 flex items-center gap-1">{n.ip} <ExternalLink size={10} /></a>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <p className="text-[10px] font-black text-green-800 opacity-60 uppercase">Total Clientes</p>
                    <p style={{ color: colors.sidebar }} className="text-2xl font-black">{clientesNodo.length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePrintNodo(n, clientesNodo)} title="Imprimir lista" className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      <Printer size={22} />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`¿Deseas eliminar el repartidor ${n.nombre}? Esta acción desconectará visualmente a sus clientes.`)) {
                          deleteDoc(doc(db, 'nodos', n.id));
                        }
                      }} 
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {clientesNodo.map(c => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl gap-3 border border-transparent hover:border-green-200 transition-all">
                    <div className="flex-1">
                      <p className="font-black text-gray-800 uppercase text-sm">{c.nombre} {c.apellido}</p>
                      <a href={`http://${c.ip}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-green-700 font-bold hover:underline flex items-center gap-1">{c.ip} <ExternalLink size={9} /></a>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                       <div className="bg-white px-4 py-2 rounded-xl border flex flex-col items-center">
                          <div className="flex gap-4 text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                            <span>LOCAL</span><span>REMOTA</span>
                          </div>
                          <div className="text-gray-700 text-base font-black tracking-tighter">
                            {c.señal || '0'} <span className="text-gray-200 mx-0.5">/</span> {c.señalRemota || '0'} <small className="text-[10px] text-gray-400 ml-1">dBm</small>
                          </div>
                       </div>
                       <div className="bg-white px-3 py-1.5 rounded-lg border flex flex-col items-center">
                          <span className="text-[9px] text-gray-400 uppercase leading-none mb-1">Plan</span>
                          <span className="text-green-700">{c.plan}M</span>
                       </div>
                       {c.prestamo && (
                         <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg flex flex-col items-center">
                           <span className="text-[9px] uppercase leading-none mb-1">Estado</span>
                           <span>PRÉSTAMO</span>
                         </div>
                       )}
                       {c.ftth && (
                         <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex flex-col items-center">
                           <span className="text-[9px] uppercase leading-none mb-1">Estado</span>
                           <span>FTTH</span>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
                {clientesNodo.length === 0 && <p className="text-center py-4 text-gray-400 font-bold italic text-sm">Sin clientes vinculados</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- CONFIGURACIÓN DE PESTAÑA SOPORTE ---
function SoporteView({ clientes, nodos, db }) {
  const [reportType, setReportType] = useState('CLIENTE'); // Opciones: 'CLIENTE' o 'AP'
  const [report, setReport] = useState({ targetId: '', falla: 'Sin internet', comentario: '' });
  
  // Limpiar el destino del reporte cada vez que cambiamos de tipo de infraestructura
  useEffect(() => {
    setReport(prev => ({ ...prev, targetId: '' }));
  }, [reportType]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!report.targetId) {
      return alert(reportType === 'CLIENTE' ? "Selecciona un cliente" : "Selecciona una AP / Nodo");
    }

    let textoTelegram = "";
    let metadataGuardado = {};

    if (reportType === 'CLIENTE') {
      const cli = clientes.find(c => c.id === report.targetId);
      textoTelegram = `🚨 *REPORTE EXONET*\n👤 CLIENTE: ${cli?.nombre || ''} ${cli?.apellido || ''}\n📡 AP: ${cli?.ap || 'N/A'}\n⚠️ INFORME / FALLA: ${report.falla}\n💬 NOTA: ${report.comentario}`;
      metadataGuardado = {
        tipoReporte: 'CLIENTE',
        targetId: report.targetId,
        nombreIdentificador: `${cli?.nombre} ${cli?.apellido}`
      };
    } else {
      const nodo = nodos.find(n => n.id === report.targetId);
      textoTelegram = `📡 *REPORTE EXONET - INFRAESTRUCTURA AP* 📡\n⚡ REPARTIDOR REVISADO: AP / ${nodo?.nombre || ''}\n🌐 IP: ${nodo?.ip || ''}\n⚠️ INFORME / FALLA: ${report.falla}\n💬 OBSERVACIONES: ${report.comentario}`;
      metadataGuardado = {
        tipoReporte: 'AP',
        targetId: report.targetId,
        nombreIdentificador: `AP / NODO ${nodo?.nombre}`
      };
    }
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(textoTelegram)}`, '_blank');
    
    try {
      await addDoc(collection(db, 'soporte'), { 
        falla: report.falla,
        comentario: report.comentario,
        timestamp: new Date().toLocaleString(), 
        ...metadataGuardado
      });
      setReport({ targetId: '', falla: 'Sin internet', comentario: '' });
    } catch (e) { 
      alert("Sin permisos para escribir en la base de datos de soporte."); 
    }
  };

  const handlePrint = () => {
    if (!report.targetId) {
      return alert(reportType === 'CLIENTE' ? "Selecciona un cliente primero" : "Selecciona una AP / Nodo primero");
    }

    let nombreEntidad = "";
    let detalleExtra = "";

    if (reportType === 'CLIENTE') {
      const cli = clientes.find(c => c.id === report.targetId);
      nombreEntidad = `Cliente: ${cli?.nombre} ${cli?.apellido}`;
      detalleExtra = `Nodo Asociado: ${cli?.ap || 'N/A'}`;
    } else {
      const nodo = nodos.find(n => n.id === report.targetId);
      nombreEntidad = `Equipo de Red: AP / NODO ${nodo?.nombre}`;
      detalleExtra = `IP de Gestión: ${nodo?.ip || 'N/A'}`;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <body style="font-family:sans-serif; padding:40px; color:#333;">
          <h1 style="color:#2E7D32; border-bottom:2px solid #2E7D32; padding-bottom:10px;">EXONET - REPORTE DE SOPORTE TÉCNICO</h1>
          <p style="font-size:16px; font-weight:bold;">Tipo de Incidencia: ${reportType === 'CLIENTE' ? 'SOPORTE USUARIO FINAL' : 'MANTENIMIENTO DE INFRAESTRUCTURA / AP'}</p>
          <p style="font-size:14px; font-weight:bold; uppercase">${nombreEntidad}</p>
          <p style="font-size:13px; color:#555;">${detalleExtra}</p>
          <hr style="border:0; border-top:1px dashed #ccc; margin:20px 0;"/>
          <p><strong>Falla / Categoría detectada:</strong> ${report.falla}</p>
          <p><strong>Notas de Campo / Observaciones:</strong> ${report.comentario}</p>
          <p style="margin-top:40px; font-size:11px; color:#999;">Fecha del Reporte: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close(); 
    printWindow.print();
    setReport({ targetId: '', falla: 'Sin internet', comentario: '' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 style={{ color: colors.textMain }} className="text-3xl font-black mb-8 uppercase">Soporte Técnico</h2>
      
      <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-6">
        
        {/* Toggle de Segmentación del Tipo de Reporte */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 gap-2">
          <button
            type="button"
            onClick={() => setReportType('CLIENTE')}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              reportType === 'CLIENTE' 
                ? 'bg-white text-green-800 shadow-md' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users size={16} />
            Reporte de Cliente
          </button>
          <button
            type="button"
            onClick={() => setReportType('AP')}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              reportType === 'AP' 
                ? 'bg-white text-green-800 shadow-md' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Radio size={16} />
            Reporte de AP / Nodo
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          
          {/* Desplegable Dinámico según Arquitectura de Información */}
          {reportType === 'CLIENTE' ? (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-500 uppercase px-1">Identificar Abonado afectado</label>
              <select 
                required 
                className="w-full bg-gray-50 p-5 rounded-2xl border font-bold text-gray-700 outline-none focus:border-green-500" 
                value={report.targetId} 
                onChange={e => setReport({...report, targetId: e.target.value})}
              >
                <option value="">-- SELECCIONAR CLIENTE --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.ap})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-500 uppercase px-1">Identificar Estructura AP / Nodo Crítico</label>
              <select 
                required 
                className="w-full bg-gray-50 p-5 rounded-2xl border font-bold text-green-800 outline-none focus:border-green-500" 
                value={report.targetId} 
                onChange={e => setReport({...report, targetId: e.target.value})}
              >
                <option value="">-- SELECCIONAR AP / NODO --</option>
                {nodos.map(n => (
                  <option key={n.id} value={n.id}>REPARTIDOR: {n.nombre} — (Frec: {n.frecuencia} MHz)</option>
                ))}
              </select>
            </div>
          )}

          {/* Listado de Fallas Parametrizadas */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-500 uppercase px-1">Falla o Diagnóstico Base</label>
            <select 
              className="w-full bg-gray-50 p-5 rounded-2xl border font-bold text-gray-700 outline-none focus:border-green-500" 
              value={report.falla} 
              onChange={e => setReport({...report, falla: e.target.value})}
            >
              <option>AP caída / desconectada</option>
              <option>Cable 100 LAN0</option>
              <option>Obstrucción de frecuencia</option>
              <option>Cambio de frecuencia</option>
              <option>Rendimiento bajo</option>
              <option>Reinicio por pérdida de energía</option>
              <option>Actualización</option>
              <option>Otro</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-500 uppercase px-1">Observaciones</label>
            <textarea 
              placeholder=""
              className="w-full bg-gray-50 p-5 rounded-2xl border h-32 outline-none focus:border-green-500 font-medium text-gray-800" 
              value={report.comentario} 
              onChange={e => setReport({...report, comentario: e.target.value})} 
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              type="submit" 
              style={{ backgroundColor: colors.sidebar }} 
              className="flex-1 py-5 rounded-2xl text-white font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <Send size={24}/> ENVIAR POR TELEGRAM
            </button>
            <button 
              type="button" 
              onClick={handlePrint} 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 py-5 px-8 rounded-2xl font-black shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <Printer size={24}/> IMPRIMIR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
