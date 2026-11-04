// ===== Configuración BD =====
const RUTA_BD = 'bd/baseDatos.json';
let usuariosDB = [];
const CLAVE_SESION = 'hf_usuarioId';
let usuarioId = null;

const contenedorResultados = document.querySelector('#buscar .resultados');
const formBusqueda = document.getElementById('form-busqueda');

// ===== Utilidades para arreglar el texto =====
function normalizar(texto) {
  return (texto || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita tildes
}

function formatearPrecio(n) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'USD'
  }).format(n);
}

function obtenerUsuarioId() {
  const params = new URLSearchParams(window.location.search);
  const desdeUrl = params.get('usuarioId');
  if (desdeUrl) {
    localStorage.setItem(CLAVE_SESION, desdeUrl);
    return desdeUrl;
  }
  return localStorage.getItem(CLAVE_SESION);
}

function obtenerNombreUsuario(id) {
  if (!id) return '';
  const usuario = usuariosDB.find(u => u.id === id);
  return usuario?.nombre || id; // si no lo encuentra, muestra el id ultomo id
}

function actualizarUIUsuario() {
  const contenedor = document.querySelector('.acciones-sesion');
  if (!contenedor) return;

  if (usuarioId) {
    const nombreMostrar = obtenerNombreUsuario(usuarioId);

    contenedor.innerHTML = `
      <a href="reserva.html?usuarioId=${usuarioId}" class="btn-sesion login">Ver Reservas</a>
      <div class="menu-usuario">
        <button class="btn-usuario" id="btn-menu-usuario" aria-haspopup="true" aria-expanded="false">
          <span class="btn-usuario-nombre">${nombreMostrar}</span>
          <span class="btn-usuario-flecha">▾</span>
        </button>
        <div class="dropdown-usuario" id="dropdown-usuario" hidden>
          <a href="perfil.html?usuarioId=${usuarioId}" class="dropdown-item">Ver perfil</a>
          <button type="button" class="dropdown-item cerrar" id="cerrar-sesion">Cerrar sesión</button>
        </div>
      </div>
    `;

    const btnMenu = document.getElementById('btn-menu-usuario');
    const dropdown = document.getElementById('dropdown-usuario');

    btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const abierto = !dropdown.hidden;
      dropdown.hidden = abierto;
      btnMenu.setAttribute('aria-expanded', String(!abierto));
    });

    document.getElementById('cerrar-sesion').addEventListener('click', () => {
      localStorage.removeItem(CLAVE_SESION);
      window.location.href = 'index.html';
    });

  } else {
    contenedor.innerHTML = `
      <a href="login.html" class="btn-sesion login">Iniciar sesión</a>
      <a href="registro.html" class="btn-sesion registro">Registrarse</a>
    `;
  }
}

function crearTarjetaVuelo(vuelo) {
  const card = document.createElement('article');
  card.className = 'vuelo';

  card.innerHTML = `
    <h3>${vuelo.origen} → ${vuelo.destino}</h3>
    <p><strong>Fecha:</strong> ${vuelo.fechaSalida}</p>
    <p><strong>Hora de salida:</strong> ${vuelo.horaSalida}</p>
    <p><strong>Asientos Disponibles:</strong> ${vuelo.asientosDisponibles}</p
    <p><strong>Precio:</strong> ${formatearPrecio(vuelo.precio)}</p>
    <p><strong>Vuelo:</strong> ${vuelo.id}</p>
    <button class="boton" data-id="${vuelo.id}">Reservar</button>
  `;

  card.querySelector('button').addEventListener('click', () => {
    reservarVuelo(vuelo);
  });

  return card;
}

function renderizarVuelos(lista) {
  contenedorResultados.innerHTML = '';

  if (!lista.length) {
    const p = document.createElement('p');
    p.className = 'mensaje';
    p.textContent = 'No se encontraron vuelos con esos criterios.';
    contenedorResultados.appendChild(p);
    return;
  }

  const fragmento = document.createDocumentFragment();
  lista.forEach(v => fragmento.appendChild(crearTarjetaVuelo(v)));
  contenedorResultados.appendChild(fragmento);
}

// ===== Carga toda la pagina =====
async function cargarVuelos() {
  try {
    const respuesta = await fetch(RUTA_BD);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const datos = await respuesta.json();
    vuelosDisponibles = Array.isArray(datos.vuelos) ? datos.vuelos : [];
    usuariosDB = Array.isArray(datos.usuarios) ? datos.usuarios : [];

    // Refresca la UI por si el nombre se calcula tras cargar la BD
    actualizarUIUsuario();
    // Mostrar todos los vuelos al cargar
    renderizarVuelos(vuelosDisponibles);
  } catch (error) {
    console.error('Error cargando base de datos:', error);
    contenedorResultados.innerHTML =
      '<p class="mensaje">No se pudieron cargar los vuelos. Intenta más tarde.</p>';
  }
}

function buscarVuelos({ origen, destino, hora, fecha }) {
  const o = normalizar(origen);
  const d = normalizar(destino);

  return vuelosDisponibles.filter(v => {
    const coincideOrigen = !o || normalizar(v.origen).includes(o);
    const coincideDestino = !d || normalizar(v.destino).includes(d);

    const coincideHora = !hora || v.horaSalida >= hora;
    const coincideFecha = !fecha || v.fechaSalida === fecha;

    return coincideOrigen && coincideDestino && coincideHora && coincideFecha;
  });
}

function manejarBusqueda(evento) {
  evento.preventDefault();

  const origen = document.getElementById('origen').value;
  const destino = document.getElementById('destino').value;
  const hora = document.getElementById('hora').value;
  const fecha = document.getElementById('fecha').value;

  const resultados = buscarVuelos({ origen, destino, hora, fecha });
  renderizarVuelos(resultados);
}

function reservarVuelo(vuelo) {
  if (!usuarioId) {
    // Sin sesión lo manda a registrarse
    window.location.href = 'registro.html';
    return;
  }

  // Con sesión lo manda a reserva.html con datos del usuario y vuelo
  const params = new URLSearchParams({
    usuarioId,
    vueloId: vuelo.id
  });
  window.location.href = `reserva.html?${params.toString()}`;
}

// ===== Inicialización, actualiza el bloque =====
document.addEventListener('DOMContentLoaded', () => {
  usuarioId = obtenerUsuarioId();
  actualizarUIUsuario();
  cargarVuelos();
  formBusqueda.addEventListener('submit', manejarBusqueda);
});

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('dropdown-usuario');
  const btnMenu = document.getElementById('btn-menu-usuario');
  if (!dropdown || dropdown.hidden) return;

  const clickDentroDropdown = dropdown.contains(e.target);
  const clickEnBoton = btnMenu && btnMenu.contains(e.target);

  if (!clickDentroDropdown && !clickEnBoton) {
    dropdown.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
  }
});

