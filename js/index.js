// ===== Configuración =====
const RUTA_BD = 'bd/baseDatos.json';

let vuelosDisponibles = [];

// ===== Referencias al DOM =====
const contenedorResultados = document.querySelector('#buscar .resultados');
const formBusqueda = document.getElementById('form-busqueda');

// ===== Utilidades =====
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

// ===== Render de tarjetas =====
function crearTarjetaVuelo(vuelo) {
  const card = document.createElement('article');
  card.className = 'vuelo';

  card.innerHTML = `
    <h3>${vuelo.origen} → ${vuelo.destino}</h3>
    <p><strong>Fecha:</strong> ${vuelo.fechaSalida}</p>
    <p><strong>Hora de salida:</strong> ${vuelo.horaSalida}</p>
    <p><strong>Precio:</strong> ${formatearPrecio(vuelo.precio)}</p>
    <p><strong>Vuelo:</strong> ${vuelo.id}</p>
    <button class="boton" data-id="${vuelo.id}">Reservar</button>
  `;

  // Botón reservar (queda listo para integrarlo con reservas)
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

// ===== Carga inicial =====
async function cargarVuelos() {
  try {
    const respuesta = await fetch(RUTA_BD);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const datos = await respuesta.json();
    vuelosDisponibles = Array.isArray(datos.vuelos) ? datos.vuelos : [];

    // Mostrar todos los vuelos al cargar
    renderizarVuelos(vuelosDisponibles);
  } catch (error) {
    console.error('Error cargando base de datos:', error);
    contenedorResultados.innerHTML =
      '<p class="mensaje">No se pudieron cargar los vuelos. Intenta más tarde.</p>';
  }
}

// ===== Búsqueda =====
function buscarVuelos({ origen, destino, hora, fecha }) {
  const o = normalizar(origen);
  const d = normalizar(destino);

  return vuelosDisponibles.filter(v => {
    const coincideOrigen = !o || normalizar(v.origen).includes(o);
    const coincideDestino = !d || normalizar(v.destino).includes(d);

    // Hora: interpretamos "hora de partida (origen)" como hora exacta o posterior
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

// ===== Reserva (placeholder, listo para ampliar) =====
function reservarVuelo(vuelo) {
  // Aquí podrías guardar la reserva en bd/reservas o redirigir al registro.
  alert(`Vuelo seleccionado:\n${vuelo.origen} → ${vuelo.destino}\n${vuelo.fechaSalida} ${vuelo.horaSalida}`);
}

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
  cargarVuelos();
  formBusqueda.addEventListener('submit', manejarBusqueda);
});
