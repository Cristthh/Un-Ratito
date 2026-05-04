// ============================================================
//  1. GSAP & UTILIDADES GLOBALES (Fase 2)
// ============================================================
gsap.registerPlugin(ScrollToPlugin);

function enterNavegar(event, nextId) { if (event.key === 'Enter') { event.preventDefault(); const sig = document.getElementById(nextId); if (sig) sig.focus(); } }
function enterAccion(event, callback) { if (event.key === 'Enter') { event.preventDefault(); callback(); } }
function enterAccionCondicional(event) { if (event.key === 'Enter') { event.preventDefault(); const btn = document.getElementById('btn-confirmar-pago'); if (!btn.disabled) procesarVentaBD(); else document.getElementById('input-efectivo').focus(); } }

function mostrarToast(mensaje, tipo = 'success') {
    const iconos = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const clases = { success: '', error: 'toast-error', warning: 'toast-warning', info: 'toast-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${clases[tipo]}`;
    toast.innerHTML = `<i data-lucide="${iconos[tipo]}" class="toast-icon"></i><span class="toast-msg">${mensaje}</span>`;
    document.getElementById('toast-container').appendChild(toast);
    lucide.createIcons({root: toast});
    gsap.to(toast, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
    setTimeout(() => { gsap.to(toast, { opacity: 0, x: 40, duration: 0.3, ease: 'power2.in', onComplete: () => toast.remove() }); }, 3000);
}

function primeraLetraMayuscula(str) {
    if (!str) return '';
    const conectores = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'con', 'para', 'por', 'en', 'al'];
    const palabras = str.trim().toLowerCase().split(/\s+/);
    
    return palabras.map((palabra, index) => {
        if (index === 0 || !conectores.includes(palabra)) {
            return palabra.charAt(0).toUpperCase() + palabra.slice(1);
        }
        return palabra;
    }).join(' ');
}

function formatearFechaDDMMAAAA(fechaIso) {
    const d = new Date(fechaIso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
}

// --- SPINNER & LOADING SYSTEM ---
function setButtonLoading(btnId, text = 'Procesando...') {
    const btn = document.getElementById(btnId);
    if (!btn) return null;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="lucide-spinner"></i> ${text}`;
    lucide.createIcons({ root: btn });
    return originalHTML;
}

function clearButtonLoading(btnId, originalHTML) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    lucide.createIcons({ root: btn });
}

// ============================================================
//  2. SISTEMA DE MODALES FLOTANTES (GSAP Premium)
// ============================================================
const modalTimelines = {};

function crearTimelineModal(overlayId, boxId) {
    const overlay = document.getElementById(overlayId); const box = document.getElementById(boxId);
    const tl = gsap.timeline({ paused: true });
    tl.to(overlay, { opacity: 1, pointerEvents: 'auto', duration: 0.25, ease: 'power2.out' })
      .fromTo(box, { scale: 0.94, y: 15, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.2)' }, '-=0.1');
    return tl;
}

function abrirModal(overlayId, boxId) { 
    if (!modalTimelines[overlayId]) modalTimelines[overlayId] = crearTimelineModal(overlayId, boxId); 
    modalTimelines[overlayId].play(); 
}
function cerrarModal(overlayId) { if (modalTimelines[overlayId]) modalTimelines[overlayId].reverse(); }

function abrirModalInsumo(id) { if(id) editarInsumoLogic(id); else limpiarFormInsumoLogic(); abrirModal('modal-form-insumo', 'modal-insumo-box'); setTimeout(() => document.getElementById('i-nombre').focus(), 300); }
function cerrarModalInsumo() { cerrarModal('modal-form-insumo'); }

function abrirModalProducto(p) { if(p) editarProductoLogic(p); else limpiarFormProductoLogic(); abrirModal('modal-form-producto', 'modal-producto-box'); setTimeout(() => document.getElementById('p-nombre').focus(), 300); }
function cerrarModalProducto() { cerrarModal('modal-form-producto'); }

function abrirModalGasto(id) { if(id) editarGastoLogic(id); else limpiarFormGastoLogic(); abrirModal('modal-form-gasto', 'modal-gasto-box'); setTimeout(() => document.getElementById('g-monto').focus(), 300); }
function cerrarModalGasto() { cerrarModal('modal-form-gasto'); }

function abrirModalUsuario(u = null) {
    if(u) editarUsuarioLogic(u);
    else limpiarFormUsuarioLogic();
    abrirModal('modal-form-usuario', 'modal-usuario-box');
    setTimeout(() => document.getElementById('u-nombre').focus(), 300);
}
function cerrarModalUsuario() {
    cerrarModal('modal-form-usuario');
}

// ============================================================
//  3. TRANSICIONES DE PÁGINA (View Shift y Swipe Móvil)
// ============================================================
let vistaActual = 'pos';
let transitioning = false;
let pendingView = null;
let pendingTabEl = null;

function setActiveTab(tabEl) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
}

function getTabByView(viewId) {
    return document.querySelector(`.nav-tab[onclick*="showView('${viewId}'"]`);
}

// 🚀 MEJORA DE RENDIMIENTO: Función vaciada para evitar peticiones a DB al cambiar de pestaña.
function runViewLoaders(viewId) {
    // Ya no hacemos cargarVentas(), cargarGastos(), etc. aquí.
    // Toda la data se cargó en init() y se mantiene sincronizada con cada acción de guardado/edición.
    // Esto hace que el cambio entre pestañas sea instantáneo y no dependa del internet.
}

function showView(viewId, tabEl = null) {
    if (viewId === vistaActual && !transitioning) {
        setActiveTab(tabEl || getTabByView(viewId));
        return;
    }
    
    if (transitioning) {
        pendingView = viewId;
        pendingTabEl = tabEl || getTabByView(viewId);
        return;
    }
    
    const saliente = document.getElementById(`view-${vistaActual}`);
    const entrante = document.getElementById(`view-${viewId}`);
    if (!entrante || !saliente) return;
    
    transitioning = true;
    pendingView = null;
    pendingTabEl = null;
    
    runViewLoaders(viewId);
    
    // --- LÓGICA DE VISIBILIDAD DE LA LUPA DE ZOOM ---
    const zoomWidget = document.querySelector('.zoom-widget-container');
    if (zoomWidget) {
        if (viewId === 'pos') {
            zoomWidget.style.display = 'flex';
        } else {
            zoomWidget.style.display = 'none';
        }
    }
    // ------------------------------------------------
    
    entrante.classList.add('gsap-transitioning');
    entrante.classList.add('active');
    gsap.set(entrante, { y: 15, scale: 0.98, opacity: 0 });
    
    const tl = gsap.timeline({
        onComplete: () => {
            saliente.classList.remove('active');
            saliente.style.display = '';
            gsap.set(saliente, { clearProps: 'all' });
            
            entrante.classList.remove('gsap-transitioning');
            gsap.set(entrante, { clearProps: 'all' });
            
            vistaActual = viewId;
            setActiveTab(tabEl || getTabByView(viewId));
            transitioning = false;
            
            if (pendingView && pendingView !== vistaActual) {
                const nextView = pendingView;
                const nextTab = pendingTabEl;
                pendingView = null;
                pendingTabEl = null;
                requestAnimationFrame(() => showView(nextView, nextTab));
            }
        }
    });
    
    tl.to(saliente, { opacity: 0, scale: 0.98, y: -10, duration: 0.18, ease: 'power2.in' });
    tl.fromTo(entrante, { opacity: 0, scale: 0.98, y: 15 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }, '-=0.05');
}

function initMobileSwipeNavigation() {
    const area = document.querySelector('.content-area');
    if (!area) return;
    
    let startX = 0; let startY = 0;
    
    area.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
    }, { passive: true });
    
    area.addEventListener('touchend', (e) => {
        const target = e.target;
        if (target.closest('input, textarea, select, button, .qty-control, .chip-cat, .overlay, .table-container, #filtros-categorias')) return;
        
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        
        if (Math.abs(dx) < 60) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
        
        const ordenVistas = ['pos', 'gastos', 'surtido', 'historial', 'config'];
        const vistasPermitidas = ordenVistas.filter(vId => {
            const tab = getTabByView(vId);
            return tab && !tab.classList.contains('hidden') && window.getComputedStyle(tab).display !== 'none';
        });
        
        const actualIndex = vistasPermitidas.indexOf(vistaActual);
        if (actualIndex === -1) return;
        
        if (dx < 0 && actualIndex < vistasPermitidas.length - 1) {
            showView(vistasPermitidas[actualIndex + 1]);
        } else if (dx > 0 && actualIndex > 0) {
            showView(vistasPermitidas[actualIndex - 1]);
        }
    }, { passive: true });
}

function showConfigTab(tabId, btn) {
    document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    document.querySelectorAll('.config-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`config-${tabId}`);
    if(panel) panel.classList.add('active');
    
    // 🚀 MEJORA DE RENDIMIENTO: Eliminamos cargarProductos() y cargarUsuarios()
    // Ya están en memoria y se actualizan solos al guardar. El cambio será instantáneo.
}

function animarFilasTabla(tbodyId) {
    const filas = document.querySelectorAll(`#${tbodyId} tr`); if (filas.length === 0) return;
    gsap.fromTo(filas, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out', clearProps: 'all' });
}

// ============================================================
//  4. ZOOM GLOBAL & ADAPTATIVO
// ============================================================
let zoomMenuVisible = false; 
let currentZoomPercentage = 100; 

function toggleZoomMenu() {
    const menu = document.getElementById('zoom-menu');
    if (!zoomMenuVisible) { menu.style.display = 'flex'; gsap.fromTo(menu, { opacity: 0, y: 8, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }); } 
    else { gsap.to(menu, { opacity: 0, y: 8, scale: 0.95, duration: 0.15, ease: 'power2.in', onComplete: () => menu.style.display = 'none' }); }
    zoomMenuVisible = !zoomMenuVisible;
}

function cambiarZoomGlobal(delta, reset = false) {
  if (reset) {
    currentZoomPercentage = 100;
  } else {
    currentZoomPercentage = Math.max(60, Math.min(150, currentZoomPercentage + delta));
  }
  
  const zoomText = document.getElementById('zoom-text-val');
  if (zoomText) zoomText.innerText = currentZoomPercentage + '%';
  
  // 1. Escala global instantánea (Solo en escritorio para no romper navegación móvil)
  if (window.innerWidth > 768) {
      document.documentElement.style.fontSize = currentZoomPercentage + '%';
  } else {
      document.documentElement.style.fontSize = '100%';
  }
  
  // 2. Escala suave controlada por variables (Siempre activo para POS móvil)
  aplicarZoomControlesMoviles();
}

function aplicarZoomControlesMoviles() {
  const z = currentZoomPercentage;
  const root = document.documentElement;
  let btnSize, btnFont, btnFontMinus, qtyFont, gap, padY, padX, maxH, cardMinH;
  let fabSize, fabFont, qtyWidth, fabGap, fabOffsetY, cardBottomSpace;
  let cardWidth, cardTitleSize, cardPriceSize, cardPad;
  
  if (z <= 60) {
    btnSize = 24; btnFont = 13; btnFontMinus = 17; qtyFont = 0.88; gap = 4; padY = 3; padX = 5; maxH = 2.1; cardMinH = 3.3;
    fabSize = 1.95; fabFont = 1.10; qtyWidth = 1.95; fabGap = 0.28; fabOffsetY = 0.95; cardBottomSpace = 1.35;
    cardWidth = 4.4; cardTitleSize = 0.75; cardPriceSize = 0.85; cardPad = 0.35;
  } else if (z <= 70) {
    btnSize = 26; btnFont = 14; btnFontMinus = 18; qtyFont = 0.90; gap = 4; padY = 3; padX = 5; maxH = 2.2; cardMinH = 3.5;
    fabSize = 2.05; fabFont = 1.16; qtyWidth = 2.00; fabGap = 0.30; fabOffsetY = 1.00; cardBottomSpace = 1.42;
    cardWidth = 4.7; cardTitleSize = 0.78; cardPriceSize = 0.90; cardPad = 0.40;
  } else if (z <= 80) {
    btnSize = 28; btnFont = 15; btnFontMinus = 19; qtyFont = 0.95; gap = 4; padY = 4; padX = 6; maxH = 2.35; cardMinH = 3.7;
    fabSize = 2.15; fabFont = 1.22; qtyWidth = 2.10; fabGap = 0.32; fabOffsetY = 1.02; cardBottomSpace = 1.48;
    cardWidth = 5.0; cardTitleSize = 0.82; cardPriceSize = 0.95; cardPad = 0.45;
  } else if (z <= 90) {
    btnSize = 30; btnFont = 16; btnFontMinus = 20; qtyFont = 1.00; gap = 5; padY = 4; padX = 6; maxH = 2.5; cardMinH = 3.9;
    fabSize = 2.20; fabFont = 1.28; qtyWidth = 2.15; fabGap = 0.34; fabOffsetY = 1.04; cardBottomSpace = 1.55;
    cardWidth = 5.3; cardTitleSize = 0.85; cardPriceSize = 0.98; cardPad = 0.48;
  } else if (z <= 100) {
    btnSize = 32; btnFont = 17; btnFontMinus = 21; qtyFont = 1.05; gap = 6; padY = 5; padX = 7; maxH = 2.7; cardMinH = 4.1;
    fabSize = 2.25; fabFont = 1.35; qtyWidth = 2.20; fabGap = 0.35; fabOffsetY = 1.05; cardBottomSpace = 1.60;
    cardWidth = 5.6; cardTitleSize = 0.875; cardPriceSize = 1.00; cardPad = 0.50;
  } else if (z <= 110) {
    btnSize = 33; btnFont = 18; btnFontMinus = 22; qtyFont = 1.08; gap = 6; padY = 5; padX = 8; maxH = 2.8; cardMinH = 4.25;
    fabSize = 2.35; fabFont = 1.42; qtyWidth = 2.28; fabGap = 0.38; fabOffsetY = 1.08; cardBottomSpace = 1.70;
    cardWidth = 6.0; cardTitleSize = 0.92; cardPriceSize = 1.05; cardPad = 0.53;
  } else if (z <= 120) {
    btnSize = 34; btnFont = 18; btnFontMinus = 22; qtyFont = 1.10; gap = 6; padY = 5; padX = 8; maxH = 2.9; cardMinH = 4.35;
    fabSize = 2.45; fabFont = 1.48; qtyWidth = 2.35; fabGap = 0.40; fabOffsetY = 1.12; cardBottomSpace = 1.82;
    cardWidth = 6.5; cardTitleSize = 0.96; cardPriceSize = 1.10; cardPad = 0.56;
  } else if (z <= 130) {
    btnSize = 35; btnFont = 19; btnFontMinus = 23; qtyFont = 1.13; gap = 7; padY = 6; padX = 8; maxH = 3.0; cardMinH = 4.5;
    fabSize = 2.55; fabFont = 1.55; qtyWidth = 2.45; fabGap = 0.43; fabOffsetY = 1.16; cardBottomSpace = 1.95;
    cardWidth = 7.0; cardTitleSize = 1.00; cardPriceSize = 1.15; cardPad = 0.60;
  } else if (z <= 140) {
    btnSize = 36; btnFont = 19; btnFontMinus = 23; qtyFont = 1.15; gap = 7; padY = 6; padX = 8; maxH = 3.1; cardMinH = 4.6;
    fabSize = 2.65; fabFont = 1.62; qtyWidth = 2.55; fabGap = 0.46; fabOffsetY = 1.20; cardBottomSpace = 2.08;
    cardWidth = 7.5; cardTitleSize = 1.05; cardPriceSize = 1.20; cardPad = 0.64;
  } else {
    btnSize = 38; btnFont = 20; btnFontMinus = 24; qtyFont = 1.20; gap = 8; padY = 6; padX = 9; maxH = 3.25; cardMinH = 4.8;
    fabSize = 2.80; fabFont = 1.72; qtyWidth = 2.70; fabGap = 0.50; fabOffsetY = 1.25; cardBottomSpace = 2.25;
    cardWidth = 8.0; cardTitleSize = 1.10; cardPriceSize = 1.25; cardPad = 0.68;
  }
  
  root.style.setProperty('--pc-btn-size', btnSize + 'px');
  root.style.setProperty('--pc-btn-font', btnFont + 'px');
  root.style.setProperty('--pc-btn-font-minus', btnFontMinus + 'px');
  root.style.setProperty('--pc-qty-font', qtyFont + 'rem');
  root.style.setProperty('--pc-ctrl-gap', gap + 'px');
  root.style.setProperty('--pc-ctrl-pad-y', padY + 'px');
  root.style.setProperty('--pc-ctrl-pad-x', padX + 'px');
  root.style.setProperty('--pc-ctrl-max-h', maxH + 'rem');
  root.style.setProperty('--pc-card-min-h', cardMinH + 'rem');
  
  root.style.setProperty('--fab-size', fabSize + 'rem');
  root.style.setProperty('--fab-font', fabFont + 'rem');
  root.style.setProperty('--qty-width', qtyWidth + 'rem');
  root.style.setProperty('--qty-font', qtyFont + 'rem');
  root.style.setProperty('--fab-gap', fabGap + 'rem');
  root.style.setProperty('--fab-offset-y', fabOffsetY + 'rem');
  root.style.setProperty('--card-bottom-space', cardBottomSpace + 'rem');
  
  root.style.setProperty('--card-width', cardWidth + 'rem');
  root.style.setProperty('--card-title-size', cardTitleSize + 'rem');
  root.style.setProperty('--card-price-size', cardPriceSize + 'rem');
  root.style.setProperty('--card-pad', cardPad + 'rem');
}

// ============================================================
//  5. SUPABASE & INIT
// ============================================================
const supabaseUrl = 'https://lejhmgcjegqxhcxohjmb.supabase.co';
const supabaseKey = 'sb_publishable_r068lSWcdA2J1oO0FTg8Ww_TIkcCt47';
const client = window.supabase.createClient(supabaseUrl, supabaseKey);
let currentUser = null; 
let DB = { 
    productos: [], 
    categoriasProd: [], 
    categoriasGastos: [], 
    gastos: [], 
    insumos: [], 
    usuarios: [], 
    variantesProducto: [],
    carrito: [], 
    modoEdicion: false, 
    ventaIdEdicion: null, 
    totalActual: 0 
};
let catActivaPOS = 'Todas'; let modoSams = false; 
let busquedaPOS = '';

function formatearMonedaInput(event) { let input = event.target; let valorNumerico = input.value.replace(/\D/g, ''); if (valorNumerico === '') { input.value = ''; return; } let montoFloat = (parseInt(valorNumerico, 10) / 100); input.value = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(montoFloat); }
function obtenerMontoLimpio(valorString) { if (!valorString) return 0; return parseFloat(valorString.replace(/[$,]/g, '')); }

window.addEventListener('load', () => { 
    lucide.createIcons(); 
    gsap.fromTo('#login-box', { opacity: 0, y: -25, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', delay: 0.1 }); 
    document.getElementById('login-user').focus(); 
    cargarNumerosGuardados(); 
    aplicarZoomControlesMoviles(); 
    initMobileSwipeNavigation();
});

async function intentarLogin() {
    const u = document.getElementById('login-user').value; const p = document.getElementById('login-pass').value;
    const { data } = await client.from('usuarios').select('*').eq('username', u).eq('password', p).single();
    if (data) {
        currentUser = data;
        gsap.to('#login-overlay', { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { document.getElementById('login-overlay').style.display = 'none'; const sidebar = document.getElementById('main-sidebar'); sidebar.style.display = 'flex'; gsap.fromTo(sidebar, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }); } });
        document.getElementById('user-display').innerText = `👤 ${(data.nombre_completo || data.username || '').toUpperCase()}`;
        document.querySelectorAll('.role-admin').forEach(el => { el.classList.toggle('hidden', !(data.rol === 'admin' || data.rol === 'soporte')); });
        init();
    } else {
        document.getElementById('login-error').style.display = 'block';
        gsap.fromTo('#login-box', { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)', clearProps: 'x' }); gsap.fromTo('#login-box', { x: 8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
    }
}

async function init() {
    await cargarCategorias(); 
    await cargarProductos();
    await cargarUsuarios();
    await cargarVariantesProducto();
    
    const hoyIso = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-fecha-dia').value = hoyIso; 
    document.getElementById('filtro-fecha-inicio').value = hoyIso; 
    document.getElementById('filtro-fecha-fin').value = hoyIso;
    document.getElementById('filtro-fecha-dia-gastos').value = hoyIso; 
    document.getElementById('filtro-fecha-inicio-gastos').value = hoyIso; 
    document.getElementById('filtro-fecha-fin-gastos').value = hoyIso;
    
    cargarVentas(); 
    cargarDatalistsGastos(); 
    cargarGastos(); 
    cargarSurtido(); 
}

function cargarNumerosGuardados() {
    const saved = JSON.parse(localStorage.getItem('unratito_wa_numbers') || '[]');
    const datalist = document.getElementById('saved-wa-numbers');
    datalist.innerHTML = saved.map(num => `<option value="${num}">`).join('');
}

function abrirModalWhatsApp() { document.getElementById('wa-numero').value = ''; abrirModal('modal-whatsapp', 'modal-whatsapp-box'); setTimeout(() => document.getElementById('wa-numero').focus(), 300); }
function cerrarModalWhatsApp() { cerrarModal('modal-whatsapp'); }

function enviarWhatsAppLista() {
    const num = document.getElementById('wa-numero').value.replace(/\D/g, ''); 
    if (num.length < 10) { mostrarToast("Ingresa un número válido de 10 dígitos.", "warning"); return; }

    let saved = JSON.parse(localStorage.getItem('unratito_wa_numbers') || '[]');
    if (!saved.includes(num)) {
        saved.unshift(num); 
        if (saved.length > 5) saved.pop();
        localStorage.setItem('unratito_wa_numbers', JSON.stringify(saved));
        cargarNumerosGuardados();
    }

    const byProv = {};
    DB.insumos.forEach(ins => {
        const k = ins.proveedor || 'Sin proveedor';
        if (!byProv[k]) byProv[k] = [];
        byProv[k].push(ins);
    });

    const fechaActual = formatearFechaDDMMAAAA(new Date());
    let texto = `[ LISTA DE COMPRAS - UN RATITO ]\nFecha: ${fechaActual}\n\n`;
    
    for (const [prov, items] of Object.entries(byProv)) {
        texto += `* ${prov} *\n`;
        items.forEach(ins => {
            const necesita = Math.max(0, (ins.stock_maximo || 0) - (ins.stock_actual || 0));
            if(necesita > 0) {
                const critico = (parseFloat(ins.stock_actual) <= parseFloat(ins.stock_minimo)) ? ' [!]' : '';
                texto += `- ${ins.nombre_insumo} (Faltan: ${necesita}) - Hay: ${ins.stock_actual}${critico}\n`;
            } else {
                texto += `+ ${ins.nombre_insumo} (Completo) - Hay: ${ins.stock_actual}\n`;
            }
        });
        texto += '\n';
    }

    window.open(`https://wa.me/52${num}?text=${encodeURIComponent(texto)}`, '_blank');
    mostrarToast("Redirigiendo a WhatsApp...", "success");
    cerrarModalWhatsApp();
}


// ============================================================
//  6. POS & DOM UPDATES (El Motor de Rendimiento - Fase 3)
// ============================================================

// --- HELPERS DEL CARRITO ---
function crearCartLineId() { return Date.now().toString(36) + Math.random().toString(36).substring(2); }

function buscarIndiceCarritoPorLinea(cartLineId) {
    return DB.carrito.findIndex(x => x.cart_line_id === cartLineId);
}

function cambiarCantidadLinea(cartLineId, delta) {
    const idx = buscarIndiceCarritoPorLinea(cartLineId);
    if (idx === -1) return;
    const productoId = DB.carrito[idx].id;
    DB.carrito[idx].cantidad += delta;
    if (DB.carrito[idx].cantidad <= 0) DB.carrito.splice(idx, 1);
    
    renderTicket();
    sincronizarTotalesYBarra();
    actualizarDOMProducto(productoId);
    abrirResumenMovil(); 
}

function setCantidadLinea(cartLineId, valorStr) {
    const qty = parseInt(valorStr, 10);
    const idx = buscarIndiceCarritoPorLinea(cartLineId);
    if (idx === -1) return;
    const productoId = DB.carrito[idx].id;
    
    if (isNaN(qty) || qty <= 0) {
        DB.carrito.splice(idx, 1);
    } else {
        DB.carrito[idx].cantidad = qty;
    }
    
    renderTicket();
    sincronizarTotalesYBarra();
    actualizarDOMProducto(productoId);
    abrirResumenMovil();
}

function eliminarLineaCarritoPorId(cartLineId) {
    const idx = buscarIndiceCarritoPorLinea(cartLineId);
    if (idx === -1) return;
    const productoId = DB.carrito[idx].id;
    DB.carrito.splice(idx, 1);
    
    renderTicket();
    sincronizarTotalesYBarra();
    actualizarDOMProducto(productoId);
    abrirResumenMovil(); 
}

async function vaciarCarritoCompleto() {
    const result = await Swal.fire({
        title: '¿Vaciar pedido?',
        text: "Se eliminarán todos los productos del carrito.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--peligro)',
        cancelButtonColor: '#907050',
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
    });
    if(result.isConfirmed) {
        DB.carrito = [];
        renderTicket();
        renderPOS(); 
        sincronizarTotalesYBarra();
        cerrarModal('modal-resumen-movil');
    }
}

async function cargarVariantesProducto() {
    const { data } = await client.from('productos_variantes').select('*').order('producto_id').order('orden').order('nombre');
    DB.variantesProducto = (data || []).map(v => ({
        ...v,
        precio_extra: parseFloat(v.precio_extra || 0)
    }));
}

function obtenerVariantesDeProducto(productoId) {
    return DB.variantesProducto.filter(v => v.producto_id === productoId && v.activo === true);
}

function construirLineaCarrito(producto, variante) {
    return {
        cart_line_id: crearCartLineId(),
        id: producto.id,
        nombre: producto.nombre,
        precio_base: producto.precio,
        variante_id: variante ? variante.id : null,
        variante_nombre: variante ? variante.nombre : null,
        precio_extra_variante: variante ? parseFloat(variante.precio_extra || 0) : 0,
        precio: producto.precio + (variante ? parseFloat(variante.precio_extra || 0) : 0),
        cantidad: 1
    };
}

function buscarLineaFusionable(productoId, varianteId, precioBase, precioExtra) {
    return DB.carrito.findIndex(x => 
        x.id === productoId && 
        x.variante_id === varianteId && 
        x.precio_base === precioBase && 
        x.precio_extra_variante === precioExtra
    );
}

function actualizarBusquedaPOS(val) {
    busquedaPOS = val;
    renderPOS();
}

function filtrarPOS(cat) { 
    catActivaPOS = cat; 
    renderBotonesCategoriasPOS(); 
    renderPOS(); 
    setTimeout(centrarCategoriaActiva, 40);
}

function centrarCategoriaActiva() {
    const activa = document.querySelector('#filtros-categorias .chip-cat.btn-primario');
    if (!activa) return;
    activa.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function actualizarDOMProducto(id) {
    const pcw = document.getElementById(`pcw-${id}`);
    if (!pcw) return; 

    const qty = DB.carrito.filter(x => x.id === id).reduce((sum, item) => sum + item.cantidad, 0);
    const activo = qty > 0;

    const badge = document.getElementById(`badge-${id}`);
    const input = document.getElementById(`input-qty-${id}`);

    if (activo) {
        pcw.classList.add('activo');
        if(badge) badge.innerText = qty;
        if(input) input.value = qty;
    } else {
        pcw.classList.remove('activo');
    }
}

function clickProducto(id) {
    const p = DB.productos.find(x => x.id === id);
    if (!p) return;
    
    const variantesActivas = obtenerVariantesDeProducto(id);
    
    if (variantesActivas.length > 0) {
        abrirModalVariantesProducto(p, variantesActivas);
    } else {
        agregarAlCarrito(p, null);
    }
}

function agregarAlCarrito(producto, variante = null) {
    const precioBase = producto.precio;
    const precioExtra = variante ? parseFloat(variante.precio_extra || 0) : 0;
    const varId = variante ? variante.id : null;
    
    const idx = buscarLineaFusionable(producto.id, varId, precioBase, precioExtra);
    
    if (idx !== -1) {
        DB.carrito[idx].cantidad++;
    } else {
        const nuevaLinea = construirLineaCarrito(producto, variante);
        DB.carrito.push(nuevaLinea);
    }
    
    actualizarDOMProducto(producto.id);
    sincronizarTotalesYBarra();
    renderTicket();
}

function abrirModalVariantesProducto(producto, variantes) {
    document.getElementById('titulo-variantes-pos').innerText = producto.nombre;
    
    const lista = document.getElementById('lista-variantes-pos');
    lista.innerHTML = variantes.map(v => {
        const precioExtraStr = parseFloat(v.precio_extra) > 0 ? `<span style="color:var(--primario); font-weight:900;">+$${parseFloat(v.precio_extra).toFixed(2)}</span>` : '';
        return `
            <button class="btn btn-outline" style="justify-content:space-between; text-align:left; padding:0.875rem 1rem;" onclick='seleccionarVarianteProducto(${producto.id}, ${v.id})'>
                <span style="font-size:1rem; font-weight:900;">${v.nombre}</span>
                ${precioExtraStr}
            </button>
        `;
    }).join('');
    
    abrirModal('modal-variantes-pos', 'modal-variantes-pos-box');
}

function seleccionarVarianteProducto(productoId, varianteId) {
    const p = DB.productos.find(x => x.id === productoId);
    const v = DB.variantesProducto.find(x => x.id === varianteId);
    if (!p || !v) return;
    
    agregarAlCarrito(p, v);
    cerrarModal('modal-variantes-pos');
}

function posMovilCambiar(id, delta, event) {
    event.stopPropagation();
    const idx = DB.carrito.findIndex(x => x.id === id && !x.variante_id);
    if (idx === -1) {
        if(delta > 0) {
           const p = DB.productos.find(x => x.id === id);
           agregarAlCarrito(p, null);
        }
        return;
    }
    DB.carrito[idx].cantidad += delta;
    if (DB.carrito[idx].cantidad <= 0) DB.carrito.splice(idx, 1);
    
    actualizarDOMProducto(id);
    sincronizarTotalesYBarra();
    renderTicket(); 
}

function posMovilManual(id, valor) {
    const qty = parseInt(valor, 10);
    const idx = DB.carrito.findIndex(x => x.id === id && !x.variante_id);
    if (idx === -1) {
        if(qty > 0 && !isNaN(qty)) {
             const p = DB.productos.find(x => x.id === id);
             const linea = construirLineaCarrito(p, null);
             linea.cantidad = qty;
             DB.carrito.push(linea);
             actualizarDOMProducto(id);
             sincronizarTotalesYBarra();
             renderTicket();
        }
        return;
    }
    if (isNaN(qty) || qty <= 0) {
        DB.carrito.splice(idx, 1);
    } else {
        DB.carrito[idx].cantidad = qty;
    }
    actualizarDOMProducto(id);
    sincronizarTotalesYBarra();
    renderTicket();
}

function renderPOS() {
    const esMobil = window.innerWidth <= 768;
    let filtrados = catActivaPOS === 'Todas' ? DB.productos : DB.productos.filter(p => p.categoria === catActivaPOS);
    
    if (busquedaPOS.trim() !== '') {
        const term = busquedaPOS.toLowerCase().trim();
        filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(term));
    }

    if (filtrados.length === 0) {
        document.getElementById('pos-grid').innerHTML = `
            <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; color:var(--texto-muted); text-align:center;">
                <i data-lucide="search-x" style="width:3rem; height:3rem; margin-bottom:1rem; opacity:0.5;"></i>
                <h3 style="font-weight:900; margin:0;">No hay resultados</h3>
                <p style="font-size:0.875rem; margin-top:0.5rem;">No encontramos productos que coincidan con tu búsqueda.</p>
            </div>`;
        lucide.createIcons({root: document.getElementById('pos-grid')});
        return;
    }

    document.getElementById('pos-grid').innerHTML = filtrados.map(p => {
        const qty = DB.carrito.filter(x => x.id === p.id).reduce((sum, item) => sum + item.cantidad, 0);
        const activo = qty > 0;
        const tieneVariantes = obtenerVariantesDeProducto(p.id).length > 0;
        
        const badgeVariantes = tieneVariantes ? `<div style="font-size:0.65rem; color:var(--primario); font-weight:900; text-transform:uppercase; margin-bottom:0.2rem;"><i data-lucide="layers" style="width:0.7rem; height:0.7rem; display:inline-block; vertical-align:middle; margin-right:2px;"></i>Sabores</div>` : '';
        
        if (esMobil) {
            let stepperHtml = '';
            if (!tieneVariantes) {
                stepperHtml = `
                <div class="pc-stepper-float" id="stepper-${p.id}">
                    <button class="pc-fab-btn menos" onclick="posMovilCambiar(${p.id}, -1, event)">−</button>
                    <input type="number" id="input-qty-${p.id}" class="pc-fab-qty tabular-nums" value="${qty || 1}" min="1" inputmode="numeric" pattern="[0-9]*" onchange="posMovilManual(${p.id}, this.value)" onclick="event.stopPropagation(); this.select()">
                    <button class="pc-fab-btn mas" onclick="posMovilCambiar(${p.id}, 1, event)">+</button>
                </div>`;
            } else {
                stepperHtml = `
                <div class="pc-stepper-float" style="display:flex; justify-content:center; align-items:center;">
                    <button class="btn btn-primario btn-sm" style="box-shadow:0 4px 10px rgba(0,0,0,0.15); border-radius:99px; font-size:0.75rem; padding:0.4rem 0.8rem;" onclick="event.stopPropagation(); abrirResumenMovil();">Ver en pedido</button>
                </div>`;
            }
            
            return `
            <div class="pcw${activo ? ' activo' : ''}" id="pcw-${p.id}">
                <div class="pc-badge" id="badge-${p.id}">${qty}</div>
                <div class="pc-inner" onclick="clickProducto(${p.id})">
                    ${badgeVariantes}
                    <div style="font-weight:800; font-size:var(--card-title-size, 0.875rem); line-height:1.2; color:var(--texto); margin-bottom:0.375rem;">${p.nombre}</div>
                    <div style="color:var(--primario); font-weight:900; font-size:var(--card-price-size, 1rem);" class="tabular-nums">$${p.precio.toFixed(2)}</div>
                </div>
                ${stepperHtml}
            </div>`;
        } else {
            return `
            <div class="desktop-card" onclick="clickProducto(${p.id})">
                ${badgeVariantes}
                <div style="font-weight:800; font-size:0.875rem; margin-bottom:0.375rem; line-height:1.2; color:var(--texto);">${p.nombre}</div>
                <div style="color:var(--texto); font-weight:900; font-size:1rem;" class="tabular-nums">$${p.precio.toFixed(2)}</div>
            </div>`;
        }
    }).join('');
    
    gsap.fromTo("#pos-grid > div", 
        { opacity: 0, scale: 0.9, y: 15 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "back.out(1.2)", clearProps: "all" }
    );
    lucide.createIcons({root: document.getElementById('pos-grid')});
}

function cambiarCantidad(index, delta) { 
    const id = DB.carrito[index].id; 
    DB.carrito[index].cantidad += delta; 
    if(DB.carrito[index].cantidad <= 0) DB.carrito.splice(index, 1); 
    renderTicket(); 
    actualizarDOMProducto(id); 
    sincronizarTotalesYBarra();
}
function cambiarCantidadManual(index, valorStr) { 
    const id = DB.carrito[index].id; 
    const nuevaCantidad = parseInt(valorStr, 10); 
    if(isNaN(nuevaCantidad) || nuevaCantidad <= 0) DB.carrito.splice(index, 1); 
    else DB.carrito[index].cantidad = nuevaCantidad; 
    renderTicket(); 
    actualizarDOMProducto(id); 
    sincronizarTotalesYBarra();
}
function eliminarDelCarrito(index) { 
    const id = DB.carrito[index].id; 
    DB.carrito.splice(index, 1); 
    renderTicket(); 
    actualizarDOMProducto(id); 
    sincronizarTotalesYBarra(); 
}

function renderTicket() {
    let total = 0; const t = document.getElementById('pos-ticket');
    if(DB.carrito.length === 0) { 
        t.innerHTML = `<div style="text-align:center; color:var(--texto-muted); margin-top:2rem; font-size:0.875rem; font-weight:800;"><i data-lucide="shopping-cart" style="width:2rem; height:2rem; margin-bottom:0.5rem; opacity:0.5;"></i><br>El carrito está vacío</div>`; 
    } else {
        t.innerHTML = DB.carrito.map((i, index) => {
            total += (i.precio * i.cantidad);
            const nombreMostrar = i.nombre + (i.variante_nombre ? ` <span style="color:var(--primario-hover); font-size:0.8rem;">(${i.variante_nombre})</span>` : '');
            
            return `
                <div style="display:flex; flex-direction:column; gap:0.5rem; background:white; padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--borde); box-shadow: var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-weight:800; font-size:0.875rem; flex:1;">${nombreMostrar}</div>
                        <button style="background:var(--cancelado); border:none; color:var(--peligro); border-radius:0.25rem; padding:0.25rem; cursor:pointer; margin-left:0.5rem; transition:transform 0.1s;" onclick="eliminarDelCarrito(${index})" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'"><i data-lucide="x" style="width:1rem; height:1rem;"></i></button>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="qty-control">
                            <div class="btn-qty" onclick="cambiarCantidad(${index}, -1)">-</div>
                            <input type="number" class="input-qty" value="${i.cantidad}" onchange="cambiarCantidadManual(${index}, this.value)" min="1">
                            <div class="btn-qty" onclick="cambiarCantidad(${index}, 1)">+</div>
                        </div>
                        <div style="font-weight:900; font-size:1rem; color:var(--texto);" class="tabular-nums">$${(i.precio * i.cantidad).toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');
        gsap.to(t, { scrollTo: { y: 'max' }, duration: 0.3, ease: 'power2.out' });
    }
    lucide.createIcons({root: t}); 
    DB.totalActual = total; 
    document.getElementById('pos-total').innerText = `$${total.toFixed(2)}`; 
    document.getElementById('btn-abrir-pago').disabled = total === 0;
}

function sincronizarTotalesYBarra() {
    DB.totalActual = DB.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    document.getElementById('pos-total').innerText = '$' + DB.totalActual.toFixed(2);
    document.getElementById('btn-abrir-pago').disabled = DB.totalActual <= 0;
    
    const barra = document.getElementById('barra-cobrar-movil');
    if (!barra) return;
    document.getElementById('bcm-total').innerText = '$' + DB.totalActual.toFixed(2);
    document.getElementById('bcm-btn').innerHTML = DB.modoEdicion ? '<i data-lucide="refresh-cw" style="width:1rem;height:1rem;"></i> Actualizar' : 'Cobrar →';
    lucide.createIcons({root: barra});
    barra.classList.toggle('visible', DB.carrito.length > 0);
}

function abrirResumenMovil() {
    if (!DB.carrito.length) {
        cerrarModal('modal-resumen-movil');
        return;
    }
    let total = 0;
    document.getElementById('resumen-movil-lista').innerHTML = DB.carrito.map(i => {
        const sub = i.precio * i.cantidad;
        total += sub;
        const nombreMostrar = i.nombre + (i.variante_nombre ? ` <span style="color:var(--texto-muted); font-size:0.8rem;">(${i.variante_nombre})</span>` : '');
        
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; padding:12px 0; border-bottom:1px solid var(--borde);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:800; font-size:0.9375rem;">${nombreMostrar}</span>
                    <span style="font-weight:900; color:var(--texto);" class="tabular-nums">$${sub.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="qty-control" style="background:transparent; border:none; padding:0;">
                        <div class="btn-qty" onclick="cambiarCantidadLinea('${i.cart_line_id}', -1)" style="width:2rem; height:2rem;">-</div>
                        <input type="number" class="input-qty" value="${i.cantidad}" onchange="setCantidadLinea('${i.cart_line_id}', this.value)" min="1" style="width:3rem;">
                        <div class="btn-qty" onclick="cambiarCantidadLinea('${i.cart_line_id}', 1)" style="width:2rem; height:2rem;">+</div>
                    </div>
                    <button class="btn btn-sm" style="background:var(--cancelado); color:var(--peligro); padding:0.4rem 0.5rem;" onclick="eliminarLineaCarritoPorId('${i.cart_line_id}')"><i data-lucide="trash-2" style="width:1rem; height:1rem;"></i></button>
                </div>
            </div>`;
    }).join('');
    document.getElementById('resumen-movil-total').innerText = '$' + total.toFixed(2);
    lucide.createIcons({root: document.getElementById('resumen-movil-lista')});
    abrirModal('modal-resumen-movil', 'modal-resumen-movil-box');
}

function abrirModalPago() { if(DB.totalActual <= 0) return; document.getElementById('modal-pago-total').innerText = `$${DB.totalActual.toFixed(2)}`; document.getElementById('input-efectivo').value = ''; document.getElementById('input-transferencia').value = ''; document.getElementById('pago-mensaje').innerText = ''; document.getElementById('btn-confirmar-pago').disabled = true; abrirModal('modal-pago', 'modal-pago-box'); validarMontos(); setTimeout(() => document.getElementById('input-efectivo').focus(), 300); }
function cerrarModalPago() { cerrarModal('modal-pago'); }

function validarMontos() { const ef = obtenerMontoLimpio(document.getElementById('input-efectivo').value); const tr = obtenerMontoLimpio(document.getElementById('input-transferencia').value); const suma = ef + tr; const msg = document.getElementById('pago-mensaje'); const btn = document.getElementById('btn-confirmar-pago'); if (suma === 0) { msg.innerText = ""; btn.disabled = true; return; } if (suma < DB.totalActual) { msg.style.color = 'var(--peligro)'; msg.innerText = `Faltan: $${(DB.totalActual - suma).toFixed(2)}`; btn.disabled = true; } else if (suma > DB.totalActual && tr > DB.totalActual) { msg.style.color = 'var(--peligro)'; msg.innerText = `Excede el total`; btn.disabled = true; } else { const cambio = suma - DB.totalActual; if (cambio > 0) { msg.style.color = 'var(--primario-hover)'; msg.innerText = `Cambio: $${cambio.toFixed(2)}`; } else { msg.style.color = 'var(--primario-hover)'; msg.innerText = `Monto exacto ✅`; } btn.disabled = false; } }

async function procesarVentaBD() {
    const btnId = 'btn-confirmar-pago';
    const prevHTML = setButtonLoading(btnId, 'Procesando...');
    
    const ef = obtenerMontoLimpio(document.getElementById('input-efectivo').value); const tr = obtenerMontoLimpio(document.getElementById('input-transferencia').value);
    let metodo_final = 'Mixto'; if (ef >= DB.totalActual && tr === 0) metodo_final = 'Efectivo'; if (tr >= DB.totalActual && ef === 0) metodo_final = 'Transferencia';
    
    try {
        if(DB.modoEdicion) {
            const { error } = await client.from('ventas').update({ total: DB.totalActual, metodo_pago: metodo_final, monto_efectivo: ef, monto_transferencia: tr }).eq('id', DB.ventaIdEdicion);
            if (error) throw error;
            await client.from('ventas_detalle').delete().eq('venta_id', DB.ventaIdEdicion);
            
            const nuevosDetalles = DB.carrito.map(i => ({ 
                venta_id: DB.ventaIdEdicion, 
                producto_id: i.id, 
                producto_nombre: i.nombre + (i.variante_nombre ? ' - ' + i.variante_nombre : ''), 
                cantidad: i.cantidad, 
                precio_unitario: i.precio, 
                subtotal: i.precio * i.cantidad,
                variante_id: i.variante_id || null,
                variante_nombre: i.variante_nombre || null,
                precio_base: i.precio_base,
                precio_extra_variante: i.precio_extra_variante 
            }));
            
            await client.from('ventas_detalle').insert(nuevosDetalles); mostrarToast("Venta actualizada.", "success"); cancelarEdicion();
        } else {
            const folio = `V-${Date.now().toString().slice(-6)}`;
            const { data: v, error } = await client.from('ventas').insert([{ 
                folio, 
                total: DB.totalActual, 
                metodo_pago: metodo_final, 
                monto_efectivo: ef, 
                monto_transferencia: tr, 
                estado: 'Completada', 
                cajero: currentUser.username,
                usuario_id: currentUser.id
            }]).select().single();
            if (error) throw error;
            
            const detalles = DB.carrito.map(i => ({ 
                venta_id: v.id, 
                producto_id: i.id, 
                producto_nombre: i.nombre + (i.variante_nombre ? ' - ' + i.variante_nombre : ''), 
                cantidad: i.cantidad, 
                precio_unitario: i.precio, 
                subtotal: i.precio * i.cantidad,
                variante_id: i.variante_id || null,
                variante_nombre: i.variante_nombre || null,
                precio_base: i.precio_base,
                precio_extra_variante: i.precio_extra_variante 
            }));
            
            await client.from('ventas_detalle').insert(detalles); mostrarToast(`Venta registrada: ${folio}`, "success");
        }
        cerrarModalPago(); DB.carrito =[]; renderTicket(); cargarVentas(); renderPOS(); sincronizarTotalesYBarra();
    } catch(e) { 
        mostrarToast("Error al procesar: " + e.message, "error"); 
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}

// --- CATEGORÍAS UNIVERSALES ---
function renderBotonesCategoriasPOS() {
    document.getElementById('filtros-categorias').innerHTML = `<button class="btn ${catActivaPOS === 'Todas' ? 'btn-primario' : 'btn-outline'} btn-sm" style="padding: 0.375rem 0.75rem; border-radius:99px;" onclick="filtrarPOS('Todas')">Todas</button>` + DB.categoriasProd.map(c => `<button class="btn ${catActivaPOS === c.nombre ? 'btn-primario' : 'btn-outline'} btn-sm" style="padding: 0.375rem 0.75rem; border-radius:99px;" onclick="filtrarPOS('${c.nombre}')">${c.nombre}</button>`).join(''); 
}

async function cargarCategorias() { 
    const { data: catProd } = await client.from('categorias').select('*').order('nombre'); 
    const { data: catGast } = await client.from('categorias_gastos').select('*').order('nombre'); 
    
    DB.categoriasProd = catProd || []; 
    DB.categoriasGastos = catGast ||[]; 

    document.getElementById('p-categoria').innerHTML = DB.categoriasProd.map(c => `<option value="${c.id}">${c.nombre}</option>`).join(''); 
    document.getElementById('g-categoria').innerHTML = DB.categoriasGastos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join(''); 

    renderBotonesCategoriasPOS();
}

function abrirModalCategorias(tipo) { 
    document.getElementById('tipo-cat-actual').value = tipo;
    document.getElementById('titulo-modal-cat').innerHTML = tipo === 'productos' ? '<i data-lucide="folder-tree"></i> Categorías (Productos)' : '<i data-lucide="folder-tree"></i> Categorías (Gastos)';
    lucide.createIcons();
    document.getElementById('input-nueva-cat').value = ''; 
    renderListaCategoriasModal(tipo);
    abrirModal('modal-categorias', 'modal-categorias-box'); 
}

function cerrarModalCategorias() { cerrarModal('modal-categorias'); }

function renderListaCategoriasModal(tipo) { 
    const lista = document.getElementById('lista-categorias-modal'); 
    const arr = tipo === 'productos' ? DB.categoriasProd : DB.categoriasGastos;
    if (arr.length === 0) { lista.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--texto-muted); font-weight:800;">No hay categorías</div>`; return; } 
    lista.innerHTML = arr.map(c => `<div class="cat-list-item"><span style="font-weight:800;">${c.nombre}</span><div class="cat-actions"><button style="color:var(--info);" onclick="editarCategoria(${c.id}, '${c.nombre}', '${tipo}')"><i data-lucide="edit-2"></i></button><button style="color:var(--peligro);" onclick="eliminarCategoria(${c.id}, '${c.nombre}', '${tipo}')"><i data-lucide="trash-2"></i></button></div></div>`).join(''); 
    lucide.createIcons({root: lista});
}

async function guardarNuevaCategoria() { 
    let nombre = primeraLetraMayuscula(document.getElementById('input-nueva-cat').value); 
    const tipo = document.getElementById('tipo-cat-actual').value;
    const tabla = tipo === 'productos' ? 'categorias' : 'categorias_gastos';

    if (!nombre) { mostrarToast("Escribe un nombre", "warning"); return; } 
    
    const btnId = 'btn-guardar-categoria';
    const prevHTML = setButtonLoading(btnId);

    try { 
        const { error } = await client.from(tabla).insert([{ nombre }]); 
        if (error) throw error;
        document.getElementById('input-nueva-cat').value = ''; 
        await cargarCategorias(); 
        renderListaCategoriasModal(tipo);
        mostrarToast("Categoría guardada", "success"); 
    } catch (e) { 
        mostrarToast("Error: " + e.message, "error"); 
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}

async function editarCategoria(id, nombre_actual, tipo) { 
    let nuevo_nombre = prompt("Editar nombre:", nombre_actual); 
    if (!nuevo_nombre || nuevo_nombre.trim() === '' || nuevo_nombre === nombre_actual) return; 
    nuevo_nombre = primeraLetraMayuscula(nuevo_nombre);
    const tabla = tipo === 'productos' ? 'categorias' : 'categorias_gastos';
    try { 
        const { error } = await client.from(tabla).update({ nombre: nuevo_nombre }).eq('id', id); 
        if (error) throw error;
        await cargarCategorias(); await cargarProductos(); 
        renderListaCategoriasModal(tipo);
        mostrarToast("Actualizado", "success"); 
    } catch (e) { mostrarToast("Error", "error"); } 
}

async function eliminarCategoria(id, nombre_actual, tipo) { 
    const tabla = tipo === 'productos' ? 'categorias' : 'categorias_gastos';
    const result = await Swal.fire({ title: `¿Eliminar "${nombre_actual}"?`, text: "Esta acción no se puede deshacer.", icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--peligro)', cancelButtonColor: '#907050', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', customClass: { popup: 'swal2-custom-border' } });
    if (result.isConfirmed) { 
        const { error } = await client.from(tabla).delete().eq('id', id); 
        if (error) { mostrarToast("No se puede borrar si está en uso.", "error"); return; }
        await cargarCategorias(); 
        renderListaCategoriasModal(tipo);
        mostrarToast("Eliminado", "info"); 
    } 
}

// --- ARQUEO DE CAJA E HISTORIAL ---
function cambiarModoFiltro() { const modo = document.getElementById('tipo-filtro-historial').value; document.getElementById('filtro-dia-container').style.display = modo === 'dia' ? 'flex' : 'none'; document.getElementById('filtro-rango-container').style.display = modo === 'rango' ? 'flex' : 'none'; cargarVentas(); }

function renderHistorialMobileCards(ventasData) {
    const cont = document.getElementById('historial-cards-mobile');
    if(!cont) return;
    cont.innerHTML = ventasData.map(v => {
        const fechaStr = formatearFechaDDMMAAAA(v.created_at);
        const horaStr = new Date(v.created_at).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
        const iconoEstado = v.estado === 'Cancelada' ? '<i data-lucide="x-circle" style="color:var(--peligro); width:1.2rem;"></i>' : '<i data-lucide="check-circle-2" style="color:var(--primario); width:1.2rem;"></i>';
        const acciones = (currentUser.rol !== 'empleado' && v.estado !== 'Cancelada') ? `<button class="btn btn-info btn-sm" onclick="prepararEdicionVenta('${v.id}', '${v.folio}')"><i data-lucide="edit-2"></i></button> <button class="btn btn-peligro btn-sm" onclick="cancelarVenta('${v.id}')"><i data-lucide="trash-2"></i></button>` : '';
        return `
        <div class="mobile-card" style="${v.estado === 'Cancelada' ? 'opacity: 0.7; background: var(--cancelado);' : ''}">
            <div class="mobile-card-header">
                <span style="font-weight:900; font-size:1.1rem;">${v.folio}</span>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span class="badge" style="background:var(--borde);">${v.cajero||'N/A'}</span>
                    ${iconoEstado}
                </div>
            </div>
            <div class="mobile-card-row"><span class="mobile-card-label">Fecha</span><span class="mobile-card-val">${fechaStr}, ${horaStr}</span></div>
            <div class="mobile-card-row"><span class="mobile-card-label">Método</span><span class="mobile-card-val">${v.metodo_pago}</span></div>
            <div class="mobile-card-row" style="margin-top:0.5rem; padding-top:0.5rem; border-top:1px dashed var(--borde);">
                <span class="mobile-card-label" style="font-size:1rem;">Total</span>
                <span class="mobile-card-val" style="font-size:1.2rem;">$${v.total.toFixed(2)}</span>
            </div>
            ${acciones ? `<div class="mobile-card-actions">${acciones}</div>` : ''}
        </div>`;
    }).join('');
    lucide.createIcons({root: cont});
}

async function cargarVentas() {
    let qVentas = client.from('ventas').select('*').order('created_at', { ascending: false }); 
    let qGastos = client.from('gastos').select('monto');
    
    const modo = document.getElementById('tipo-filtro-historial').value; 
    const hoyMexico = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

    if (modo === 'hoy') {
        qVentas = qVentas.gte('created_at', hoyMexico + 'T00:00:00-06:00').lte('created_at', hoyMexico + 'T23:59:59-06:00'); 
        qGastos = qGastos.gte('created_at', hoyMexico + 'T00:00:00-06:00').lte('created_at', hoyMexico + 'T23:59:59-06:00');
    } else if (modo === 'dia') { 
        const f = document.getElementById('filtro-fecha-dia').value; 
        if (f) {
            qVentas = qVentas.gte('created_at', f + 'T00:00:00-06:00').lte('created_at', f + 'T23:59:59-06:00');
            qGastos = qGastos.gte('created_at', f + 'T00:00:00-06:00').lte('created_at', f + 'T23:59:59-06:00');
        }
    } else if (modo === 'rango') { 
        const fi = document.getElementById('filtro-fecha-inicio').value; const ff = document.getElementById('filtro-fecha-fin').value; 
        if (fi) { qVentas = qVentas.gte('created_at', fi + 'T00:00:00-06:00'); qGastos = qGastos.gte('created_at', fi + 'T00:00:00-06:00'); }
        if (ff) { qVentas = qVentas.lte('created_at', ff + 'T23:59:59-06:00'); qGastos = qGastos.lte('created_at', ff + 'T23:59:59-06:00'); }
    }
    
    const [resVentas, resGastos] = await Promise.all([qVentas, qGastos]);
    
    const ventasData = (resVentas.data || []).map(v => ({
        ...v,
        total: parseFloat(v.total || 0),
        monto_efectivo: parseFloat(v.monto_efectivo || 0),
        monto_transferencia: parseFloat(v.monto_transferencia || 0)
    }));
    const gastosData = (resGastos.data || []).map(g => ({
        ...g,
        monto: parseFloat(g.monto || 0)
    }));

    let sumaTotal = 0; let efecVentas = 0; let transVentas = 0;
    
    document.getElementById('historial-tabla').innerHTML = ventasData.map(v => {
        if(v.estado !== 'Cancelada') {
            sumaTotal += v.total;
            efecVentas += (v.monto_efectivo || 0);
            transVentas += (v.monto_transferencia || 0);
        }
        const fechaStr = formatearFechaDDMMAAAA(v.created_at);
        const horaStr = new Date(v.created_at).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
        const iconoEstado = v.estado === 'Cancelada' ? '<i data-lucide="x-circle" style="color:var(--peligro)"></i>' : '<i data-lucide="check-circle-2" style="color:var(--primario)"></i>';
        const acciones = (currentUser.rol !== 'empleado' && v.estado !== 'Cancelada') ? `<button class="btn btn-info btn-sm" onclick="prepararEdicionVenta('${v.id}', '${v.folio}')"><i data-lucide="edit-2"></i></button> <button class="btn btn-peligro btn-sm" onclick="cancelarVenta('${v.id}')"><i data-lucide="trash-2"></i></button>` : '--';
        
        return `<tr class="${v.estado === 'Cancelada' ? 'status-cancelada' : ''}"><td><b class="tabular-nums">${v.folio}</b></td><td>${fechaStr}, ${horaStr}</td><td><span class="badge" style="background:var(--borde); color:var(--texto);">${v.cajero||'N/A'}</span></td><td>${v.metodo_pago}</td><td style="font-weight:bold; color:var(--texto);" class="tabular-nums">$${v.total.toFixed(2)}</td><td>${iconoEstado}</td><td>${acciones}</td></tr>`;
    }).join('');
    
    lucide.createIcons({root: document.getElementById('historial-tabla')});
    animarFilasTabla('historial-tabla');
    renderHistorialMobileCards(ventasData);

    const totalGastos = gastosData.reduce((acc, curr) => acc + curr.monto, 0);
    const dash = document.getElementById('resumen-dashboard');
    
    if (modo === 'hoy' || modo === 'dia') {
        const aEntregar = efecVentas - totalGastos;
        dash.innerHTML = `
            <div class="summary-box"><span class="summary-label">Ventas (Efectivo)</span><span class="summary-value val-efectivo tabular-nums">$${efecVentas.toFixed(2)}</span></div>
            <div class="summary-box"><span class="summary-label">Ventas (Transf)</span><span class="summary-value tabular-nums">$${transVentas.toFixed(2)}</span></div>
            <div class="summary-box"><span class="summary-label">Gastos Caja</span><span class="summary-value val-gasto tabular-nums">-$${totalGastos.toFixed(2)}</span></div>
            <div class="summary-box" style="background: var(--sidebar-bg); color: white;"><span class="summary-label" style="color:#d1c9bd;">A Entregar (Sin Fondo)</span><span class="summary-value tabular-nums" style="color:var(--primario);">$${aEntregar.toFixed(2)}</span></div>
        `;
    } else {
        const utilidad = sumaTotal - totalGastos;
        dash.innerHTML = `
            <div class="summary-box"><span class="summary-label">Ingresos Brutos</span><span class="summary-value val-total tabular-nums">$${sumaTotal.toFixed(2)}</span></div>
            <div class="summary-box"><span class="summary-label">Egresos (Gastos)</span><span class="summary-value val-gasto tabular-nums">-$${totalGastos.toFixed(2)}</span></div>
            <div class="summary-box" style="background: ${utilidad >= 0 ? 'var(--sidebar-bg)' : 'var(--peligro)'}; color: white;"><span class="summary-label" style="color:rgba(255,255,255,0.8);">Balance de Período</span><span class="summary-value tabular-nums" style="color:${utilidad >= 0 ? 'var(--primario)' : 'white'};">$${utilidad.toFixed(2)}</span></div>
        `;
    }
}

async function prepararEdicionVenta(id, folio) { 
    const { data: det } = await client.from('ventas_detalle').select('*').eq('venta_id', id); 
    
    DB.carrito = det.map(d => {
        const pBase = d.precio_base != null ? parseFloat(d.precio_base) : parseFloat(d.precio_unitario);
        const pExtra = d.precio_extra_variante != null ? parseFloat(d.precio_extra_variante) : 0;
        
        let nombreBase = d.producto_nombre;
        if (d.variante_nombre && nombreBase.endsWith(' - ' + d.variante_nombre)) {
            nombreBase = nombreBase.replace(' - ' + d.variante_nombre, '');
        }
        
        return { 
            cart_line_id: crearCartLineId(),
            id: d.producto_id, 
            nombre: nombreBase, 
            precio_base: pBase,
            variante_id: d.variante_id || null,
            variante_nombre: d.variante_nombre || null,
            precio_extra_variante: pExtra,
            precio: parseFloat(d.precio_unitario), 
            cantidad: d.cantidad 
        };
    }); 
    
    DB.modoEdicion = true; 
    DB.ventaIdEdicion = id; 
    document.getElementById('indicador-edicion').style.display = 'flex'; 
    document.getElementById('edit-folio').innerText = folio; 
    document.getElementById('btn-abrir-pago').innerHTML = '<i data-lucide="refresh-cw"></i> Actualizar Ticket'; 
    lucide.createIcons(); 
    showView('pos', document.querySelector('.nav-tab')); 
    renderTicket(); 
    renderPOS(); 
    sincronizarTotalesYBarra();
}

function cancelarEdicion() { DB.modoEdicion = false; DB.ventaIdEdicion = null; DB.carrito =[]; document.getElementById('indicador-edicion').style.display = 'none'; document.getElementById('btn-abrir-pago').innerHTML = '<i data-lucide="credit-card"></i> Cobrar'; lucide.createIcons(); renderTicket(); renderPOS(); sincronizarTotalesYBarra();}
async function cancelarVenta(id) { 
    const result = await Swal.fire({ title: '¿Cancelar esta venta?', text: "El folio quedará marcado como cancelado.", icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--peligro)', cancelButtonColor: '#907050', confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No' });
    if(result.isConfirmed) { await client.from('ventas').update({ estado: 'Cancelada' }).eq('id', id); cargarVentas(); mostrarToast('Venta cancelada', 'warning'); } 
}

// --- GASTOS ---
async function cargarDatalistsGastos() { const { data } = await client.from('gastos').select('proveedor, descripcion'); if (data) { const proveedores =[...new Set(data.map(g => g.proveedor).filter(Boolean))]; const conceptos =[...new Set(data.map(g => g.descripcion).filter(Boolean))]; document.getElementById('lista-proveedores').innerHTML = proveedores.map(p => `<option value="${p}">`).join(''); document.getElementById('lista-conceptos').innerHTML = conceptos.map(c => `<option value="${c}">`).join(''); } }
function cambiarModoFiltroGastos() { const modo = document.getElementById('tipo-filtro-gastos').value; document.getElementById('filtro-dia-container-gastos').style.display = modo === 'dia' ? 'flex' : 'none'; document.getElementById('filtro-rango-container-gastos').style.display = modo === 'rango' ? 'flex' : 'none'; cargarGastos(); }

function renderGastosMobileCards() {
    const cont = document.getElementById('gastos-cards-mobile');
    if(!cont) return;
    cont.innerHTML = DB.gastos.map(g => {
        const fechaStr = formatearFechaDDMMAAAA(g.created_at);
        const botonesAccion = currentUser && currentUser.rol === 'admin' 
            ? `<button class="btn btn-info btn-sm" onclick="abrirModalGasto('${g.id}')"><i data-lucide="edit-2"></i></button> <button class="btn btn-peligro btn-sm" onclick="borrarGasto('${g.id}')"><i data-lucide="trash-2"></i></button>` 
            : '';
        
        let catNombre = g.categoria || '-';
        if (g.categoria_id) {
            const cObj = DB.categoriasGastos.find(c => c.id === g.categoria_id);
            if (cObj) catNombre = cObj.nombre;
        }

        let nombreUsuario = 'Desconocido';
        if (g.usuario_id) {
            const uObj = DB.usuarios.find(u => u.id === g.usuario_id);
            if (uObj) nombreUsuario = uObj.nombre_completo || uObj.username;
        }

        return `
        <div class="mobile-card">
            <div class="mobile-card-header">
                <span style="font-weight:900;">${g.proveedor || '-'}</span>
                <span class="badge" style="background:var(--borde);">${catNombre}</span>
            </div>
            <div class="mobile-card-row"><span class="mobile-card-label">Fecha</span><span class="mobile-card-val">${fechaStr}</span></div>
            <div class="mobile-card-row"><span class="mobile-card-label">Concepto</span><span class="mobile-card-val">${g.descripcion}</span></div>
            <div class="mobile-card-row"><span class="mobile-card-label">Monto</span><span class="mobile-card-val" style="color:var(--peligro);">-$${g.monto.toFixed(2)}</span></div>
            <div class="mobile-card-row" style="margin-top:0.25rem; padding-top:0.25rem; border-top:1px dashed var(--secundario);">
                <span class="mobile-card-label" style="font-size:0.75rem;"><i data-lucide="user" style="width:0.8rem; height:0.8rem; vertical-align:middle;"></i> Registrado por</span>
                <span class="mobile-card-val" style="font-size:0.8rem; color:var(--texto-muted);">${nombreUsuario}</span>
            </div>
            ${botonesAccion ? `<div class="mobile-card-actions">${botonesAccion}</div>` : ''}
        </div>`;
    }).join('');
    lucide.createIcons({root: cont});
}

async function cargarGastos() {
    let q = client.from('gastos').select('*').order('created_at', { ascending: false }); 
    const modo = document.getElementById('tipo-filtro-gastos').value; 
    const hoyMexico = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    
    if (modo === 'hoy') q = q.gte('created_at', hoyMexico + 'T00:00:00-06:00').lte('created_at', hoyMexico + 'T23:59:59-06:00'); 
    else if (modo === 'dia') { const f = document.getElementById('filtro-fecha-dia-gastos').value; if (f) q = q.gte('created_at', f + 'T00:00:00-06:00').lte('created_at', f + 'T23:59:59-06:00'); } 
    else if (modo === 'rango') { const fi = document.getElementById('filtro-fecha-inicio-gastos').value; const ff = document.getElementById('filtro-fecha-fin-gastos').value; if (fi) q = q.gte('created_at', fi + 'T00:00:00-06:00'); if (ff) q = q.lte('created_at', ff + 'T23:59:59-06:00'); }
    
    const { data } = await q; 
    DB.gastos = (data || []).map(g => ({ ...g, monto: parseFloat(g.monto || 0) })); 
    
    let totalSuma = 0;
    document.getElementById('gastos-tabla').innerHTML = DB.gastos.map(g => {
        totalSuma += g.monto; 
        const fechaStr = formatearFechaDDMMAAAA(g.created_at);
        const botonesAccion = currentUser && currentUser.rol === 'admin' ? `<button class="btn btn-info btn-sm" onclick="abrirModalGasto('${g.id}')"><i data-lucide="edit-2"></i></button> <button class="btn btn-peligro btn-sm" onclick="borrarGasto('${g.id}')"><i data-lucide="trash-2"></i></button>` : `<i data-lucide="lock" style="color:var(--borde); width:1rem;"></i>`;
        
        let catNombre = g.categoria || '-';
        if (g.categoria_id) {
            const cObj = DB.categoriasGastos.find(c => c.id === g.categoria_id);
            if (cObj) catNombre = cObj.nombre;
        }

        let nombreUsuario = 'Desconocido';
        if (g.usuario_id) {
            const uObj = DB.usuarios.find(u => u.id === g.usuario_id);
            if (uObj) nombreUsuario = uObj.nombre_completo || uObj.username;
        }

        return `<tr><td>${fechaStr}</td><td><b>${g.proveedor || '-'}</b></td><td><span class="badge" style="background:var(--borde); color:var(--texto);">${catNombre}</span></td><td>${g.descripcion}</td><td style="color:var(--peligro); font-weight:bold;" class="tabular-nums">-$${g.monto.toFixed(2)}</td><td><span class="badge" style="background:var(--secundario); color:var(--texto-muted);"><i data-lucide="user" style="width:0.7rem; height:0.7rem; display:inline-block; vertical-align:middle; margin-right:2px;"></i>${nombreUsuario}</span></td><td>${botonesAccion}</td></tr>`;
    }).join('');
    lucide.createIcons({root: document.getElementById('gastos-tabla')});
    document.getElementById('gastos-total-filtro').innerText = `$${totalSuma.toFixed(2)}`; 
    animarFilasTabla('gastos-tabla');
    renderGastosMobileCards();
}

async function guardarGasto() {
    const id = document.getElementById('g-id').value; 
    const monto = obtenerMontoLimpio(document.getElementById('g-monto').value); 
    const proveedor = document.getElementById('g-proveedor').value.toUpperCase().trim(); 
    
    const categoria_id = parseInt(document.getElementById('g-categoria').value);
    const categoria_obj = DB.categoriasGastos.find(c => c.id === categoria_id);
    const categoria = categoria_obj ? categoria_obj.nombre : '';
    
    const descripcion = primeraLetraMayuscula(document.getElementById('g-desc').value);
    
    if(monto <= 0 || !descripcion || isNaN(categoria_id)) { mostrarToast("Falta monto, descripción o categoría.", "warning"); return; } 
    const payload = { monto, proveedor, categoria_id, categoria, descripcion, usuario_id: currentUser.id };
    
    const btnId = 'btn-guardar-gasto';
    const prevHTML = setButtonLoading(btnId);

    try {
        if (id) { const { error } = await client.from('gastos').update(payload).eq('id', id); if (error) throw error; } 
        else { const { error } = await client.from('gastos').insert([payload]); if (error) throw error; }
        cerrarModalGasto(); cargarDatalistsGastos(); await cargarGastos(); mostrarToast("Gasto guardado", "success");
    } catch(e) { 
        mostrarToast("Error: " + e.message, "error"); 
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}
function editarGastoLogic(id) { 
    const g = DB.gastos.find(x => x.id === id); 
    if (!g) return; 
    document.getElementById('form-gasto-titulo').innerHTML = `<i data-lucide="edit-3"></i> Editar Gasto`; 
    lucide.createIcons(); 
    document.getElementById('g-id').value = g.id; 
    document.getElementById('g-monto').value = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(g.monto); 
    document.getElementById('g-proveedor').value = g.proveedor; 
    
    let catIdToSet = g.categoria_id;
    if (!catIdToSet) {
        const found = DB.categoriasGastos.find(c => c.nombre === g.categoria);
        if (found) catIdToSet = found.id;
    }
    document.getElementById('g-categoria').value = catIdToSet || '';
    
    document.getElementById('g-desc').value = g.descripcion; 
}
function limpiarFormGastoLogic() { document.getElementById('form-gasto-titulo').innerHTML = `<i data-lucide="minus-circle"></i> Registrar Gasto`; lucide.createIcons();['g-id','g-monto','g-proveedor','g-desc'].forEach(id => document.getElementById(id).value = ''); document.getElementById('g-categoria').value = ''; }
async function borrarGasto(id) { 
    const result = await Swal.fire({ title: '¿Eliminar este gasto?', icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--peligro)', cancelButtonColor: '#907050', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (result.isConfirmed) { await client.from('gastos').delete().eq('id', id); cargarGastos(); mostrarToast("Gasto eliminado", "info"); } 
}

// --- SURTIDO ---
async function cargarSurtido() { 
    const { data } = await client.from('insumos').select('*').order('nombre_insumo'); 
    DB.insumos = (data || []).map(i => ({
        ...i,
        stock_actual: parseFloat(i.stock_actual || 0),
        stock_minimo: parseFloat(i.stock_minimo || 0),
        stock_maximo: parseFloat(i.stock_maximo || 0)
    })); 
    renderSurtido(); 
}

function toggleListaSams() { modoSams = !modoSams; const btn = document.getElementById('btn-filtro-sams'); if (modoSams) { btn.className = 'btn btn-peligro'; btn.innerHTML = '<i data-lucide="alert-triangle"></i> Mostrando Faltantes'; } else { btn.className = 'btn btn-outline'; btn.innerHTML = '<i data-lucide="alert-circle"></i> Ver Faltantes'; } lucide.createIcons(); renderSurtido(); }

function renderSurtidoMobileCards(filtrados) {
    const cont = document.getElementById('surtido-cards-mobile');
    if(!cont) return;
    cont.innerHTML = filtrados.map(i => {
        const actual = parseFloat(i.stock_actual); const minimo = parseFloat(i.stock_minimo); const maximo = parseFloat(i.stock_maximo);
        let colorEstado = actual <= minimo ? 'var(--peligro)' : actual >= maximo ? '#43694F' : '#A67623';
        return `
        <div class="mobile-card" style="border-left: 4px solid ${colorEstado}">
            <div class="mobile-card-header">
                <span style="font-weight:900;">${i.nombre_insumo}</span>
                <span class="badge" style="background:rgba(0,0,0,0.05);">${i.proveedor || '-'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <span class="mobile-card-label">Stock Actual</span>
                <input type="number" step="any" value="${i.stock_actual}" class="input-stock" style="width:5rem; padding:0.25rem;" onchange="actualizarStockDirecto('${i.id}', this.value)">
            </div>
            <div class="mobile-card-row"><span class="mobile-card-label">Mínimo</span><span class="mobile-card-val">${i.stock_minimo}</span></div>
            <div class="mobile-card-row"><span class="mobile-card-label">Máximo</span><span class="mobile-card-val">${i.stock_maximo}</span></div>
            <div class="mobile-card-actions">
                <button class="btn btn-info btn-sm" onclick="abrirModalInsumo('${i.id}')"><i data-lucide="edit-2"></i></button>
                <button class="btn btn-peligro btn-sm" onclick="borrarInsumo('${i.id}')"><i data-lucide="trash-2"></i></button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons({root: cont});
}

function renderSurtido() {
    let filtrados = DB.insumos; if (modoSams) filtrados = DB.insumos.filter(i => parseFloat(i.stock_actual) <= parseFloat(i.stock_minimo));
    document.getElementById('surtido-tabla').innerHTML = filtrados.map(i => {
        const actual = parseFloat(i.stock_actual); const minimo = parseFloat(i.stock_minimo); const maximo = parseFloat(i.stock_maximo);
        let claseEstado = actual <= minimo ? 'estado-rojo' : actual >= maximo ? 'estado-verde' : 'estado-naranja';
        return `<tr class="${claseEstado}"><td><b>${i.nombre_insumo}</b></td><td><span class="badge" style="background:rgba(255,255,255,0.6); color:inherit; border:1px solid rgba(0,0,0,0.1);">${i.proveedor || '-'}</span></td><td><input type="number" step="any" value="${i.stock_actual}" class="input-stock" onchange="actualizarStockDirecto('${i.id}', this.value)"></td><td class="tabular-nums">${i.stock_minimo}</td><td class="tabular-nums">${i.stock_maximo}</td><td><button class="btn btn-info btn-sm" onclick="abrirModalInsumo('${i.id}')"><i data-lucide="edit-2"></i></button> <button class="btn btn-peligro btn-sm" onclick="borrarInsumo('${i.id}')"><i data-lucide="trash-2"></i></button></td></tr>`;
    }).join('');
    lucide.createIcons({root: document.getElementById('surtido-tabla')});
    animarFilasTabla('surtido-tabla');
    renderSurtidoMobileCards(filtrados);
}

async function actualizarStockDirecto(id, nuevoValor) { const valor = parseFloat(nuevoValor); if (isNaN(valor)) return; await client.from('insumos').update({ stock_actual: valor }).eq('id', id); const insumo = DB.insumos.find(i => i.id === id); if (insumo) insumo.stock_actual = valor; renderSurtido(); }

async function guardarInsumo() {
    const id = document.getElementById('i-id').value; 
    let nombre_insumo = primeraLetraMayuscula(document.getElementById('i-nombre').value); 
    let proveedor = document.getElementById('i-proveedor').value.toUpperCase().trim();
    const stock_actual = parseFloat(document.getElementById('i-actual').value) || 0; const stock_minimo = parseFloat(document.getElementById('i-minimo').value) || 0; const stock_maximo = parseFloat(document.getElementById('i-maximo').value) || 0;
    
    if(!nombre_insumo) { mostrarToast('El nombre del insumo es obligatorio.', 'warning'); return; }
    const payload = { nombre_insumo, proveedor, stock_actual, stock_minimo, stock_maximo };
    
    const btnId = 'btn-guardar-insumo';
    const prevHTML = setButtonLoading(btnId);

    try {
        if(id) { const { error } = await client.from('insumos').update(payload).eq('id', id); if(error) throw error;} 
        else { const { error } = await client.from('insumos').insert([payload]); if(error) throw error;}
        cerrarModalInsumo(); await cargarSurtido(); mostrarToast('Insumo guardado', 'success');
    } catch(e) { 
        mostrarToast("Error: " + e.message, "error"); 
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}
function editarInsumoLogic(id) { const i = DB.insumos.find(x => x.id === id); if(!i) return; document.getElementById('form-insumo-titulo').innerHTML = `<i data-lucide="edit-3"></i> Editar Insumo`; lucide.createIcons(); document.getElementById('i-id').value = i.id; document.getElementById('i-nombre').value = i.nombre_insumo; document.getElementById('i-proveedor').value = i.proveedor || ''; document.getElementById('i-actual').value = i.stock_actual; document.getElementById('i-minimo').value = i.stock_minimo; document.getElementById('i-maximo').value = i.stock_maximo; }
function limpiarFormInsumoLogic() { document.getElementById('form-insumo-titulo').innerHTML = `<i data-lucide="box"></i> Añadir Insumo`; lucide.createIcons();['i-id','i-nombre','i-proveedor','i-actual','i-minimo','i-maximo'].forEach(id => document.getElementById(id).value = ''); }
async function borrarInsumo(id) { 
    const result = await Swal.fire({ title: '¿Eliminar este insumo?', icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--peligro)', cancelButtonColor: '#907050', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if(result.isConfirmed) { await client.from('insumos').delete().eq('id', id); cargarSurtido(); mostrarToast('Insumo eliminado', 'info'); } 
}

// --- CONFIGURACIÓN DE PRODUCTOS Y VARIANTES ---
async function cargarProductos() { 
    const { data } = await client.from('productos').select('*').order('nombre'); 
    DB.productos = (data || []).map(p => ({
        ...p,
        precio: parseFloat(p.precio || 0)
    })); 
    renderPOS(); 
    renderTablaProductos(); 
}

function renderTablaProductos() { 
    document.getElementById('tabla-productos').innerHTML = DB.productos.map(p => `
        <tr>
            <td><b>${p.nombre}</b></td>
            <td><span class="badge" style="background:var(--borde); color:var(--texto);">${p.categoria}</span></td>
            <td style="color:var(--primario); font-weight:bold;" class="tabular-nums">$${p.precio.toFixed(2)}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick='abrirModalVariantesAdmin(${JSON.stringify(p)})' title="Gestionar Sabores/Variantes"><i data-lucide="layers"></i></button>
                <button class="btn btn-info btn-sm" onclick='abrirModalProducto(${JSON.stringify(p)})'><i data-lucide="edit-2"></i></button> 
                <button class="btn btn-peligro btn-sm" onclick="borrarProducto(${p.id})"><i data-lucide="trash-2"></i></button>
            </td>
        </tr>
    `).join(''); 
    lucide.createIcons({root: document.getElementById('tabla-productos')}); 
    animarFilasTabla('tabla-productos'); 
}

async function guardarProducto() {
    const id = document.getElementById('p-id').value; 
    const nombre = primeraLetraMayuscula(document.getElementById('p-nombre').value); 
    
    const categoria_id = parseInt(document.getElementById('p-categoria').value);
    const categoria_obj = DB.categoriasProd.find(c => c.id === categoria_id);
    const categoria = categoria_obj ? categoria_obj.nombre : '';
    
    const precio = obtenerMontoLimpio(document.getElementById('p-precio').value);
    
    if (!nombre || isNaN(precio) || isNaN(categoria_id)) { mostrarToast("Falta nombre, categoría o precio.", "warning"); return; } 
    const payload = { nombre, categoria_id, categoria, precio };
    
    const btnId = 'btn-guardar-producto';
    const prevHTML = setButtonLoading(btnId);

    try {
        if(id) { const { error } = await client.from('productos').update(payload).eq('id', id); if(error) throw error;} 
        else { const { error } = await client.from('productos').insert([payload]); if(error) throw error;}
        cerrarModalProducto(); await cargarProductos(); mostrarToast("Producto guardado", "success");
    } catch(e) { 
        mostrarToast("Error: " + e.message, "error"); 
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}

function editarProductoLogic(p) { 
    document.getElementById('form-prod-titulo').innerHTML = `<i data-lucide="edit-3"></i> Editar Producto`; 
    lucide.createIcons(); 
    document.getElementById('p-id').value = p.id; 
    document.getElementById('p-nombre').value = p.nombre; 
    
    let catIdToSet = p.categoria_id;
    if (!catIdToSet) {
        const found = DB.categoriasProd.find(c => c.nombre === p.categoria);
        if (found) catIdToSet = found.id;
    }
    document.getElementById('p-categoria').value = catIdToSet || ''; 
    
    document.getElementById('p-precio').value = p.precio > 0 ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p.precio) : ''; 
}

function limpiarFormProductoLogic() { 
    document.getElementById('form-prod-titulo').innerHTML = `<i data-lucide="tag"></i> Añadir Producto`; 
    lucide.createIcons(); 
    document.getElementById('p-id').value = ''; 
    document.getElementById('p-nombre').value = ''; 
    document.getElementById('p-categoria').value = ''; 
    document.getElementById('p-precio').value = ''; 
}

async function borrarProducto(id) { 
    const result = await Swal.fire({ title: '¿Eliminar producto?', icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--peligro)', cancelButtonColor: '#907050', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if(result.isConfirmed) { await client.from('productos').delete().eq('id', id); cargarProductos(); mostrarToast("Producto eliminado", "info"); } 
}

function abrirModalVariantesAdmin(producto) {
    document.getElementById('v-producto-id').value = producto.id;
    document.getElementById('variante-producto-nombre').innerText = `Producto: ${producto.nombre}`;
    limpiarFormVarianteAdmin();
    renderListaVariantesAdmin(producto.id);
    abrirModal('modal-form-variante-admin', 'modal-variante-admin-box');
}

function limpiarFormVarianteAdmin() {
    document.getElementById('v-id').value = '';
    document.getElementById('v-nombre').value = '';
    document.getElementById('v-precio-extra').value = '';
    document.getElementById('v-orden').value = '0';
}

function renderListaVariantesAdmin(productoId) {
    const lista = document.getElementById('lista-variantes-admin');
    const variantes = DB.variantesProducto.filter(v => v.producto_id === productoId);
    
    if (variantes.length === 0) {
        lista.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--texto-muted); font-weight:800;">No tiene variantes</div>`;
        return;
    }
    
    lista.innerHTML = variantes.map(v => `
        <div class="cat-list-item" style="${!v.activo ? 'opacity:0.6;' : ''}">
            <div>
                <div style="font-weight:900;">${v.nombre} <span style="color:var(--primario); font-size:0.8rem;">(+$${parseFloat(v.precio_extra).toFixed(2)})</span></div>
                <div style="font-size:0.7rem; color:var(--texto-muted); font-weight:800;">Orden: ${v.orden} | ${v.activo ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div class="cat-actions">
                <button style="color:var(--info);" onclick='editarVarianteAdmin(${JSON.stringify(v)})'><i data-lucide="edit-2"></i></button>
                <button style="color:var(--peligro);" onclick="borrarVarianteProducto(${v.id}, ${productoId})"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons({root: lista});
}

function editarVarianteAdmin(v) {
    document.getElementById('v-id').value = v.id;
    document.getElementById('v-nombre').value = v.nombre;
    document.getElementById('v-precio-extra').value = parseFloat(v.precio_extra) > 0 ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v.precio_extra) : '';
    document.getElementById('v-orden').value = v.orden;
}

async function guardarVarianteProducto() {
    const producto_id = parseInt(document.getElementById('v-producto-id').value);
    const id = document.getElementById('v-id').value;
    const nombre = primeraLetraMayuscula(document.getElementById('v-nombre').value);
    const precio_extra = obtenerMontoLimpio(document.getElementById('v-precio-extra').value) || 0;
    const orden = parseInt(document.getElementById('v-orden').value) || 0;
    
    if (!nombre) { mostrarToast("El nombre es requerido", "warning"); return; }
    
    const payload = { producto_id, nombre, precio_extra, orden, activo: true };
    
    const btnId = 'btn-guardar-variante';
    const prevHTML = setButtonLoading(btnId);

    try {
        if(id) { 
            const { error } = await client.from('productos_variantes').update(payload).eq('id', id); 
            if(error) throw error;
        } else { 
            const { error } = await client.from('productos_variantes').insert([payload]); 
            if(error) throw error;
        }
        await cargarVariantesProducto(); 
        limpiarFormVarianteAdmin();
        renderListaVariantesAdmin(producto_id);
        renderPOS(); 
        mostrarToast("Variante guardada", "success");
    } catch(e) { 
        mostrarToast("Error: " + e.message, "error"); 
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}

async function borrarVarianteProducto(id, producto_id) {
    const result = await Swal.fire({ title: '¿Eliminar variante?', icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--peligro)', cancelButtonColor: '#907050', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if(result.isConfirmed) { 
        const { error } = await client.from('productos_variantes').delete().eq('id', id);
        if (error) { mostrarToast("Error: " + error.message, "error"); return; }
        await cargarVariantesProducto(); 
        renderListaVariantesAdmin(producto_id);
        renderPOS();
        mostrarToast("Variante eliminada", "info"); 
    } 
}

// --- USUARIOS ---
async function cargarUsuarios() {
    const { data, error } = await client
        .from('usuarios')
        .select('*')
        .order('nombre_completo', { ascending: true });
    
    if (error) {
        mostrarToast('Error al cargar usuarios: ' + error.message, 'error');
        return;
    }
    
    DB.usuarios = data || [];
    renderTablaUsuarios();
}

function renderTablaUsuarios() {
    const tbody = document.getElementById('tabla-usuarios');
    if(!tbody) return;
    
    tbody.innerHTML = DB.usuarios.map(u => `
        <tr>
            <td><b>${u.nombre_completo || ''}</b></td>
            <td>${u.username || ''}</td>
            <td>
                <span class="badge" style="background:var(--borde); color:var(--texto);">
                    ${u.rol || ''}
                </span>
            </td>
            <td>
                <button class="btn btn-info btn-sm" onclick='abrirModalUsuario(${JSON.stringify({
                    id: u.id,
                    nombre_completo: u.nombre_completo || '',
                    username: u.username || '',
                    password: u.password || '',
                    rol: u.rol || 'empleado'
                })})'>
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="btn btn-peligro btn-sm" onclick="borrarUsuario(${u.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons({ root: tbody });
    animarFilasTabla('tabla-usuarios');
}

function editarUsuarioLogic(u) {
    document.getElementById('form-usuario-titulo').innerHTML = `
        <i data-lucide="edit-3" style="color:var(--primario);"></i> Editar Usuario
    `;
    document.getElementById('u-id').value = u.id || '';
    document.getElementById('u-nombre').value = u.nombre_completo || '';
    document.getElementById('u-username').value = u.username || '';
    document.getElementById('u-password').value = u.password || '';
    document.getElementById('u-rol').value = u.rol || 'empleado';
    lucide.createIcons();
}

function limpiarFormUsuarioLogic() {
    document.getElementById('form-usuario-titulo').innerHTML = `
        <i data-lucide="user-plus" style="color:var(--primario);"></i> Añadir Usuario
    `;
    document.getElementById('u-id').value = '';
    document.getElementById('u-nombre').value = '';
    document.getElementById('u-username').value = '';
    document.getElementById('u-password').value = '';
    document.getElementById('u-rol').value = 'empleado';
    lucide.createIcons();
}

async function guardarUsuario() {
    const id = document.getElementById('u-id').value;
    const nombre_completo = document.getElementById('u-nombre').value.trim();
    const username = document.getElementById('u-username').value.trim();
    const password = document.getElementById('u-password').value.trim();
    const rol = document.getElementById('u-rol').value;
    
    if(!nombre_completo || !username || !password || !rol) {
        mostrarToast('Falta nombre, usuario, contraseña o rol.', 'warning');
        return;
    }
    
    const payload = { nombre_completo, username, password, rol, activo: true };
    const btnId = 'btn-guardar-usuario';
    const prevHTML = setButtonLoading(btnId);

    try {
        if(id) {
            const { error } = await client.from('usuarios').update(payload).eq('id', id);
            if(error) throw error;
        } else {
            const { error } = await client.from('usuarios').insert(payload);
            if(error) throw error;
        }
        cerrarModalUsuario();
        await cargarUsuarios();
        mostrarToast('Usuario guardado.', 'success');
    } catch(e) {
        mostrarToast('Error: ' + e.message, 'error');
    } finally {
        if (prevHTML) clearButtonLoading(btnId, prevHTML);
    }
}

async function borrarUsuario(id) {
    const result = await Swal.fire({
        title: '¿Eliminar usuario?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--peligro)',
        cancelButtonColor: '#907050',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if(!result.isConfirmed) return;
    
    try {
        const { error } = await client.from('usuarios').delete().eq('id', id);
        if(error) throw error;
        await cargarUsuarios();
        mostrarToast('Usuario eliminado.', 'info');
    } catch(e) {
        mostrarToast('Error: ' + e.message, 'error');
    }
}