// ===== Configuración =====
const RUTA_BD = 'bd/baseDatos.json';
const CLAVE_SESION = 'hf_usuarioId';
const CLAVE_USUARIOS_EXTRA = 'hf_usuarios_extra';

const formLogin = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputPassword = document.getElementById('password');
const errorBox = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');

function mostrarError(mensaje) {
  errorBox.textContent = mensaje;
  errorBox.hidden = false;
}

function limpiarError() {
  errorBox.textContent = '';
  errorBox.hidden = true;
}

function leerUsuariosExtra() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIOS_EXTRA)) || [];
  } catch {
    return [];
  }
}

function cargarUsuarios() {
  return fetch(RUTA_BD)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(datos => {
      const base = Array.isArray(datos.usuarios) ? datos.usuarios : [];
      const agentes = Array.isArray(datos.agenteBoleto) ? datos.agenteBoleto : [];
      // Unimos ambos arrays para que el login acepte a los dos
      return [...base, ...agentes, ...leerUsuariosExtra()];
    })
    .catch(err => {
      console.error('Error cargando BD:', err);
      return leerUsuariosExtra();
    });
}

function iniciarSesion(usuarioId) {
  localStorage.setItem(CLAVE_SESION, usuarioId);
  window.location.href = `index.html?usuarioId=${encodeURIComponent(usuarioId)}`;
}

function sugerirRecuperacion() {
  const acepta = confirm(
    '¿Deseas recuperar tu contraseña?\n\nSe enviará un correo con las instrucciones para restablecerla.'
  );

  if (acepta) {
    alert('Se ha enviado un correo de recuperación a tu dirección registrada.');
  }
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarError();

  const email = inputEmail.value.trim().toLowerCase();
  const password = inputPassword.value;

  if (!email || !password) {
    mostrarError('Completa todos los campos.');
    return;
  }

  btnLogin.disabled = true;
  btnLogin.textContent = 'Verificando…';

  try {
    const usuarios = await cargarUsuarios();

    const usuarioPorEmail = usuarios.find(u =>
      (u.email || '').toLowerCase() === email
    );

    const usuarioValido = usuarios.find(u =>
      (u.email || '').toLowerCase() === email && u.password === password
    );

    if (usuarioValido) {
      iniciarSesion(usuarioValido.id);
      return;
    }

    // Credenciales incorrectas
    if (usuarioPorEmail) {
      mostrarError('Contraseña incorrecta. ¿Olvidaste tu contraseña?');
    } else {
      mostrarError('Correo o contraseña incorrectos. ¿Olvidaste tu contraseña?');
    }

    sugerirRecuperacion();

  } catch (err) {
    mostrarError('No se pudo conectar con el servidor. Intenta de nuevo.');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
});
