// Happy Flight Airline - prototipo frontend con datos JSON
let vuelos = [];
let clienteActual = null;

async function cargarVuelos() {
  try {
    const respuesta = await fetch("bd/vuelos.json");
    if (!respuesta.ok) throw new Error("No se pudo cargar vuelos.json");
    vuelos = await respuesta.json();
  } catch (error) {
    document.getElementById("resultados").innerHTML =
      '<p class="mensaje">No se pudieron cargar los vuelos. Ejecuta el proyecto con un servidor local.</p>';
    console.error(error);
  }
}

document.getElementById("form-busqueda").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const destino = document.getElementById("destino").value.trim().toLowerCase();
  const hora = document.getElementById("hora").value;
  const encontrados = vuelos.filter(vuelo =>
    vuelo.destino.toLowerCase().includes(destino) && vuelo.hora >= hora
  );
  mostrarVuelos(encontrados);
});

function mostrarVuelos(lista) {
  const contenedor = document.getElementById("resultados");
  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="mensaje">No hay vuelos que coincidan con tu búsqueda.</p>';
    return;
  }

  contenedor.innerHTML = lista.map(vuelo => `
    <article class="vuelo">
      <h3>Vuelo ${vuelo.numero}</h3>
      <p><strong>Destino:</strong> ${vuelo.destino}</p>
      <p><strong>Partida:</strong> ${vuelo.hora}</p>
      <p><strong>Precio:</strong> US$${vuelo.precio}</p>
      <p><strong>Asientos disponibles:</strong> ${vuelo.asientosDisponibles}</p>
      <button class="boton" onclick="reservarVuelo('${vuelo.numero}')">Reservar</button>
    </article>
  `).join("");
}

document.getElementById("form-registro").addEventListener("submit", (evento) => {
  evento.preventDefault();
  clienteActual = {
    nombre: document.getElementById("nombre").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    compania: document.getElementById("compania").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    tipo: document.getElementById("tipo-cliente").value
  };

  // En esta primera versión se guarda el registro en el navegador.
  // Un JSON estático no puede modificarse desde JavaScript del navegador.
  localStorage.setItem("happyFlightCliente", JSON.stringify(clienteActual));
  document.getElementById("registro-mensaje").textContent =
    `¡Bienvenido/a ${clienteActual.nombre}! Registro guardado en este navegador.`;
});

function reservarVuelo(numeroVuelo) {
  if (!clienteActual) {
    alert("Debes registrarte antes de reservar un vuelo.");
    document.getElementById("registro").scrollIntoView({ behavior: "smooth" });
    return;
  }
  const vuelo = vuelos.find(v => v.numero === numeroVuelo);
  if (!vuelo || vuelo.asientosDisponibles <= 0) {
    alert("Este vuelo no tiene asientos disponibles.");
    return;
  }
  const asiento = prompt("Indica el número de asiento que deseas (ej. 12A):");
  if (!asiento || !asiento.trim()) return;

  // Reserva demostrativa: no modifica el JSON ni envía correo real.
  alert(`Reserva de demostración\nVuelo: ${vuelo.numero}\nAsiento: ${asiento}\nCliente: ${clienteActual.nombre}\n\nLa confirmación por correo se integrará en el backend.`);
}

cargarVuelos();
