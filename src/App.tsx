import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreData, Product, AppState } from './types';

const STORE_KEY = 'tienda_app_state_v5';

const DEFAULT_CONFIG = {
  tienda: "Inversiones Chupaalperro 668 C.A",
  whatsapp: "584126887277",
  whatsappVisible: "0412-688-7277",
  tasaBCV: 874.73,
  banco: { codigo: "0102 - Banco de Venezuela", cedula: "V-12123123", telefono: "04126887277" }
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catLabel, setCatLabel] = useState<Record<string, string>>({});
  
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        return { customerName: "", quantities: {}, refNumber: "", category: "all", query: "", ...JSON.parse(saved) };
      }
    } catch(e) {}
    return { customerName: "", quantities: {}, refNumber: "", category: "all", query: "" };
  });

  const [saveStatus, setSaveStatus] = useState("Guardado");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  
  // Modales
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [customerInputName, setCustomerInputName] = useState("");
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryBtnRef = useRef<HTMLButtonElement>(null);

  // Cargar datos
  useEffect(() => {
    fetch('./productos.json?v=' + Date.now())
      .then(res => res.json())
      .then((data: StoreData) => {
        if (data.config) {
          setConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.categorias) {
          setCategories(data.categorias);
          const map: Record<string, string> = {};
          data.categorias.forEach(c => map[c.id] = c.nombre);
          setCatLabel(map);
        }
        if (data.productos) {
          setProducts(data.productos);
        }
      })
      .catch(err => console.error("Error cargando productos:", err));
  }, []);

  // Persistencia
  useEffect(() => {
    setSaveStatus("Guardando...");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch(e) {}
      setSaveStatus("Guardado");
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  // Si no hay nombre de cliente, abrir modal al iniciar
  useEffect(() => {
    if (!state.customerName) {
      setIsCustomerModalOpen(true);
    }
  }, []);

  const showToast = (msg: string, ms = 4000) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), ms);
  };

  const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const priceBs = (p: Product) => p.precioUSD * config.tasaBCV;

  // Totales
  const totals = () => {
    let items = 0, bs = 0;
    products.forEach(p => {
      const q = state.quantities[p.id] || 0;
      items += q;
      bs += q * priceBs(p);
    });
    return { items, bs, usd: config.tasaBCV > 0 ? bs / config.tasaBCV : 0 };
  };

  const t = totals();

  const changeQty = (id: number, delta: number) => {
    setState(prev => {
      const current = prev.quantities[id] || 0;
      const next = Math.max(0, current + delta);
      const newQuantities = { ...prev.quantities };
      if (next === 0) {
        delete newQuantities[id];
      } else {
        newQuantities[id] = next;
      }
      return { ...prev, quantities: newQuantities };
    });
  };

  const setQtyExact = (id: number, val: number) => {
    setState(prev => {
      const n = Math.max(0, val);
      const newQuantities = { ...prev.quantities };
      if (n === 0) {
        delete newQuantities[id];
      } else {
        newQuantities[id] = n;
      }
      return { ...prev, quantities: newQuantities };
    });
  };

  const vaciarPedido = () => {
    if (t.items === 0) {
      showToast('El pedido ya está vacío');
      return;
    }
    if (!confirm('¿Borrar todos los productos seleccionados?')) return;
    setState(prev => ({ ...prev, quantities: {}, refNumber: '' }));
    showToast('Pedido vaciado');
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = state.category === 'all' || p.categoria === state.category;
    const q = state.query.toLowerCase();
    const matchesQuery = !q || p.titulo.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="wrap">
          <span><i className="fa-solid fa-truck-fast"></i>Tu Local de confianza a tu alcance</span>
          <div className="right">
            <span className="hide-m2"><i className="fa-regular fa-clock"></i>Lun–Sáb 6:00am – 8:00pm</span>
            <span><i className="fa-solid fa-phone"></i><span id="topPhone">{config.whatsappVisible}</span></span>
            <span><span className="save-dot"></span><span id="saveTxt">{saveStatus}</span></span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="main">
        <div className="wrap">
          <div className="head-row">
            <div className="brand" onClick={() => setState(prev => ({ ...prev, category: 'all', query: '' }))} style={{ cursor: 'pointer' }}>
              <motion.div className="logo" whileHover={{ rotate: -10, scale: 1.08 }} transition={{ duration: 0.3 }}>
                <i className="fa-solid fa-cart-shopping"></i>
              </motion.div>
              <div><b>Chupaalperro <span>668</span></b><small>Supermercado Online</small></div>
            </div>

            <div className="search">
              <i className="fa-solid fa-magnifying-glass ico"></i>
              <input
                type="text"
                ref={searchInputRef}
                placeholder="Buscar harina, arroz, café, aceite..."
                value={state.query}
                onChange={e => setState(prev => ({ ...prev, query: e.target.value }))}
                autoComplete="off"
              />
              {state.query && (
                <button className="clr" style={{ display: 'block' }} onClick={() => setState(prev => ({ ...prev, query: '' }))}>
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>

            <div className="head-actions">
              <div className="chip rate" title="Tasa BCV">
                <span className="lbl hide-m">Tasa BCV</span><i className="fa-solid fa-dollar-sign" style={{ color: 'var(--yellow)' }}></i>
                <input type="number" readOnly value={config.tasaBCV.toFixed(2)} /><span>Bs</span>
              </div>
              <button className="chip user hide-m" onClick={() => setIsCustomerModalOpen(true)}>
                <i className="fa-regular fa-user"></i>
                <span id="hdrName">{state.customerName || 'Cliente'}</span>
                <i className="fa-solid fa-pen" style={{ fontSize: '10px', opacity: 0.7 }}></i>
              </button>
              <motion.button
                className="cart-btn"
                id="cartBtn"
                onClick={() => {
                  if (t.items === 0) showToast('Aún no has agregado productos');
                  else setIsInvoiceModalOpen(true);
                }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fa-solid fa-bag-shopping"></i>
                <span className="hide-m">Mi pedido</span>
                <motion.span className="n" key={t.items} animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 0.4 }}>
                  {t.items}
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Cat Nav */}
        <div className="catnav">
          <div className="wrap" id="catNav">
            <button
              className={`cat ${state.category === 'all' ? 'active' : ''}`}
              onClick={() => { setState(prev => ({ ...prev, category: 'all' })); setIsCategoryMenuOpen(false); }}
            >
              <i className="fa-solid fa-border-all"></i>Todos
            </button>

            <div className="dropdown">
              <button
                ref={categoryBtnRef}
                className={`cat ${state.category !== 'all' ? 'active' : ''}`}
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                aria-expanded={isCategoryMenuOpen}
              >
                <i className="fa-solid fa-bars"></i>
                <span>{state.category !== 'all' ? (catLabel[state.category] || 'Categorías') : 'Categorías'}</span>
                <i className="fa-solid fa-caret-down caret" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dropdown Overlay & Menu con Animación .tsx (Framer Motion) */}
      <AnimatePresence>
        {isCategoryMenuOpen && (
          <>
            <motion.div
              className="dropdown-overlay show"
              onClick={() => setIsCategoryMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="dropdown-menu show"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: categoryBtnRef.current ? categoryBtnRef.current.getBoundingClientRect().bottom + 8 : 120,
                left: categoryBtnRef.current ? Math.max(12, Math.min(categoryBtnRef.current.getBoundingClientRect().left, window.innerWidth - 260)) : 20,
                zIndex: 200
              }}
            >
              {categories.map(c => (
                <a
                  key={c.id}
                  href="#"
                  className={state.category === c.id ? 'active' : ''}
                  onClick={e => {
                    e.preventDefault();
                    setState(prev => ({ ...prev, category: c.id }));
                    setIsCategoryMenuOpen(false);
                  }}
                >
                  <i className={`fa-solid ${c.icono}`}></i>
                  <span>{c.nombre}</span>
                </a>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contenido Principal */}
      <main className="wrap" style={{ flex: 1, paddingBottom: t.items > 0 ? '120px' : '40px' }}>
        {/* Hero Section animado con Framer Motion (.tsx) */}
        <motion.section
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-main">
            <span className="tag"><i className="fa-solid fa-fire"></i>Ofertas de la semana</span>
            <h2>Tu mercado completo, directo a tu hogar</h2>
            <p>Productos frescos y de marcas confiables al mejor precio. Arma tu pedido y págalo por Pago Móvil.</p>
            <button className="btn-hero" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver catálogo <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
            </button>
          </div>
          <div className="hero-side">
            <motion.div className="mini o" whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
              <i className="fa-solid fa-truck-fast"></i><b>Retiras en la tienda</b><span>Todos tus pedidos están listos!</span>
            </motion.div>
            <motion.div className="mini d" whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
              <i className="fa-solid fa-mobile-screen-button"></i><b>Pago Móvil</b><span>Rápido y seguro</span>
            </motion.div>
          </div>
        </motion.section>

        {/* Ticker Animado (.tsx) */}
        <div className="ticker" aria-hidden="true">
          <motion.div
            className="ticker-track"
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <span><i className="fa-solid fa-tags"></i>Precios de supermercado</span>
                <span><i className="fa-solid fa-basket-shopping"></i>Arma tu pedido en minutos</span>
                <span><i className="fa-solid fa-mobile-screen-button"></i>Paga por Pago Móvil</span>
                <span><i className="fa-solid fa-store"></i>Retira en tienda al instante</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Beneficios */}
        <section className="benefits">
          {[
            { icon: 'fa-tags', title: 'Mejores precios', desc: 'Precios de supermercado' },
            { icon: 'fa-box-open', title: 'Productos de calidad', desc: 'Marcas reconocidas' },
            { icon: 'fa-brands fa-whatsapp', title: 'Pedido por WhatsApp', desc: 'Atención directa' },
            { icon: 'fa-shield-halved', title: 'Compra segura', desc: 'Factura al instante' }
          ].map((b, idx) => (
            <motion.div
              key={idx}
              className="ben"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <i className={`fa-solid ${b.icon}`}></i>
              <div><b>{b.title}</b><span>{b.desc}</span></div>
            </motion.div>
          ))}
        </section>

        {/* Catálogo */}
        <section id="catalogo">
          <div className="sec-head">
            <div><h2>Catálogo de productos</h2><p>Agrega los productos y arma tu pedido.</p></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="count">Mostrando {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}</span>
              <button className="clear-cart-btn" onClick={vaciarPedido} title="Borrar todos los productos seleccionados">
                <i className="fa-solid fa-trash-can"></i>Vaciar pedido
              </button>
            </div>
          </div>

          <div className="grid">
            {filteredProducts.map((p, idx) => {
              const q = state.quantities[p.id] || 0;
              const bs = priceBs(p);
              const usd = p.precioUSD.toFixed(2);
              const ph = `https://placehold.co/600x600/1f2937/9ca3af?text=${encodeURIComponent(p.titulo)}`;

              return (
                <motion.article
                  key={p.id}
                  className={`card ${q > 0 ? 'sel' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.5), duration: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="img">
                    <span className="badge-cat">{catLabel[p.categoria] || p.categoria}</span>
                    {q > 0 && (
                      <motion.span className="badge-qty" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        x{q}
                      </motion.span>
                    )}
                    <img
                      src={p.imagen}
                      alt={p.titulo}
                      loading="lazy"
                      onError={(e: any) => { e.target.onerror = null; e.target.src = ph; }}
                    />
                  </div>
                  <div className="brand-line"><span className="b">{p.marca}</span><span className="w">{p.peso}</span></div>
                  <h3>{p.titulo}</h3>
                  <div className="price">
                    <span className="bs">{bs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} <small>Bs</small></span>
                    <span className="usd">${usd}</span>
                  </div>

                  {q > 0 ? (
                    <div className="step">
                      <button className="m" onClick={() => changeQty(p.id, -1)}><i className="fa-solid fa-minus"></i></button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={q}
                        onChange={e => setQtyExact(p.id, parseInt(e.target.value) || 0)}
                      />
                      <button onClick={() => changeQty(p.id, 1)}><i className="fa-solid fa-plus"></i></button>
                    </div>
                  ) : (
                    <motion.button
                      className="add"
                      onClick={(e: any) => {
                        changeQty(p.id, 1);
                      }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <i className="fa-solid fa-cart-plus"></i>Agregar
                    </motion.button>
                  )}
                </motion.article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty" style={{ display: 'block' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <h3>No se encontraron productos</h3>
              <p>Prueba con otros términos o cambia de categoría.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="foot-brand"><span className="logo"><i className="fa-solid fa-cart-shopping"></i></span><span>{config.tienda}</span></div>
              <p>Tu supermercado digital. Compra desde casa y recibe tu pedido sin complicaciones.</p>
            </div>
            <div>
              <h4>Contacto</h4>
              <ul>
                <li><i className="fa-solid fa-phone"></i><span>{config.whatsappVisible}</span></li>
                <li><i className="fa-brands fa-whatsapp"></i>WhatsApp de pedidos</li>
                <li><i className="fa-regular fa-clock"></i>Lun–Sáb 6:00am – 8:00pm</li>
              </ul>
            </div>
            <div>
              <h4>Pagos y envíos</h4>
              <ul>
                <li><i className="fa-solid fa-mobile-screen-button"></i>Pago Móvil</li>
                <li><i className="fa-solid fa-truck-fast"></i>Retiras al instante</li>
                <li><i className="fa-solid fa-receipt"></i>Factura digital</li>
              </ul>
            </div>
          </div>
          <div className="copy">© {new Date().getFullYear()} {config.tienda} · Todos los derechos reservados.</div>
        </div>
      </footer>

      {/* Barra Flotante Carrito */}
      <AnimatePresence>
        {t.items > 0 && (
          <motion.div
            id="floatBar"
            style={{ display: 'block' }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="in">
              <div className="fl-l">
                <div className="fl-ico">
                  <i className="fa-solid fa-bag-shopping"></i>
                  <span className="n">{t.items}</span>
                </div>
                <div><small>Tu pedido</small><b id="flBs">{fmt(t.bs)} Bs.</b><em>(${t.usd.toFixed(2)})</em></div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="fl-clear" onClick={vaciarPedido} title="Vaciar pedido"><i className="fa-solid fa-trash-can"></i></button>
                <motion.button className="fl-go" onClick={() => setIsInvoiceModalOpen(true)} whileTap={{ scale: 0.95 }}>
                  Continuar <i className="fa-solid fa-arrow-right"></i>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cliente */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <motion.div
            className="modal show"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="box welcome"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="ic"><i className="fa-solid fa-hand"></i></div>
              <h3>¡Bienvenido!</h3>
              <p>Ingresa tu nombre para comenzar tu pedido.</p>
              <form onSubmit={e => {
                e.preventDefault();
                if (!customerInputName.trim() && !state.customerName) return;
                const name = customerInputName.trim() || state.customerName || 'Cliente';
                setState(prev => ({ ...prev, customerName: name }));
                setIsCustomerModalOpen(false);
                showToast('¡Bienvenido, ' + name + '!');
              }}>
                <div className="field">
                  <label htmlFor="custName">Nombre y Apellido *</label>
                  <input
                    type="text"
                    id="custName"
                    required
                    placeholder="Ej: Juan Pérez"
                    defaultValue={state.customerName}
                    onChange={e => setCustomerInputName(e.target.value)}
                    autoFocus
                  />
                </div>
                <button className="btn-main" type="submit">Comenzar a comprar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Factura */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <motion.div
            className="modal show"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setIsInvoiceModalOpen(false); }}
          >
            <motion.div
              className="box"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="box-h">
                <h3><i className="fa-solid fa-receipt"></i>Resumen de factura</h3>
                <button className="x" onClick={() => setIsInvoiceModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="box-b">
                <div className="receipt">
                  <div className="rc-h">
                    <h4>{config.tienda}</h4>
                    <p>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p style={{ color: 'var(--ink)', fontWeight: 700 }}>Cliente: {state.customerName || 'Cliente'}</p>
                  </div>
                  <div className="rc-cols"><span>Descripción</span><span>Subtotal</span></div>
                  <div id="invItems">
                    {products.map(p => {
                      const q = state.quantities[p.id] || 0;
                      if (!q) return null;
                      const sub = q * priceBs(p);
                      return (
                        <div key={p.id} className="rc-row">
                          <div><b>{q}x</b> {p.titulo} <small>({p.marca})</small></div>
                          <div className="r">{fmt(sub)} Bs.<small style={{ display: 'block' }}>(${ (sub / config.tasaBCV).toFixed(2) })</small></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rc-tot">
                    <span>Total: {t.items} ítems</span>
                    <span className="a">{fmt(t.bs)} Bs.<small>${t.usd.toFixed(2)} USD</small></span>
                  </div>
                </div>

                <div className="pay">
                  <div className="pay-h">
                    <b><i className="fa-solid fa-mobile-screen-button"></i> Pago Móvil</b>
                    <button className="copy-btn" onClick={() => {
                      const text = `${config.banco.codigo.split(' ')[0]}\n${config.banco.cedula.replace('V-','')}\n${config.banco.telefono}\n${t.bs.toFixed(2)}`;
                      navigator.clipboard?.writeText(text);
                      showToast('¡Datos de Pago Móvil copiados!');
                    }}>
                      <i className="fa-solid fa-copy"></i> Copiar
                    </button>
                  </div>
                  <div className="pay-d">
                    <div><span>Banco:</span><b>{config.banco.codigo}</b></div>
                    <div><span>Cédula:</span><b>{config.banco.cedula}</b></div>
                    <div><span>Teléfono:</span><b>{config.banco.telefono}</b></div>
                    <div className="tot"><span>Monto exacto:</span><b>{fmt(t.bs)} Bs.</b></div>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="refInput"><i className="fa-solid fa-hashtag" style={{ color: 'var(--orange)' }}></i> Nro. de referencia *</label>
                  <input
                    type="text"
                    id="refInput"
                    inputMode="numeric"
                    placeholder="Ej: 849201"
                    value={state.refNumber}
                    onChange={e => setState(prev => ({ ...prev, refNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                  />
                </div>

                <motion.button
                  className="wa"
                  onClick={() => {
                    if (!state.refNumber) {
                      showToast('Ingresa el Nro. de Referencia');
                      return;
                    }
                    let lines = '';
                    products.forEach(p => {
                      const q = state.quantities[p.id] || 0;
                      if (q > 0) lines += `• ${q}x ${p.titulo} - ${p.marca} (${p.peso})\n`;
                    });
                    const msg = `*NUEVO PEDIDO DE COMPRA*\n*${config.tienda}*\n*Cliente:* ${state.customerName}\n\n*PRODUCTOS SOLICITADOS:*\n${lines}\n*Nro. Referencia Pago:* ${state.refNumber}\n\n¡Gracias por su compra!`;
                    window.open('https://wa.me/' + config.whatsapp + '?text=' + encodeURIComponent(msg), '_blank');

                    setIsInvoiceModalOpen(false);
                    setState(prev => ({ ...prev, quantities: {}, refNumber: '' }));
                    showToast('¡Gracias por su compra! 🛒');
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="fa-brands fa-whatsapp"></i>Enviar pedido por WhatsApp
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastShow && (
          <motion.div
            id="toast"
            className="show"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
          >
            <i className="fa-solid fa-circle-check"></i><span id="toastMsg">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
