// app.js - servidor Node.js que sirve una página HTML autocontenida
const http = require('http');

const PORT = process.env.PORT || 3000;

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Prueba autocontenida Node.js</title>
  <style>
    :root{--bg:#0f1724;--card:#0b1220;--accent:#06b6d4;--muted:#94a3b8;--text:#e6eef6}
    html,body{height:100%;margin:0;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
    body{display:grid;place-items:center;padding:20px;background:linear-gradient(135deg,#07122a 0%, #071a2f 100%);color:var(--text)}
    .wrap{max-width:900px;width:100%;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04));border-radius:12px;padding:22px;box-shadow:0 8px 30px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.03)}
    header{display:flex;align-items:center;gap:14px;margin-bottom:18px}
    header .logo{width:56px;height:56px;border-radius:10px;background:linear-gradient(90deg,var(--accent),#7c3aed);display:grid;place-items:center;font-weight:700}
    h1{font-size:18px;margin:0}
    p.lead{margin:6px 0 0;color:var(--muted);font-size:13px}

    .grid{display:grid;grid-template-columns:1fr 320px;gap:18px;margin-top:16px}
    .card{background:var(--card);padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.02)}
    .controls label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
    .controls input[type="text"]{width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.03);background:transparent;color:var(--text)}
    .controls button{margin-top:10px;padding:10px 12px;border-radius:8px;border:0;background:var(--accent);color:#022;font-weight:600;cursor:pointer}
    .output pre{white-space:pre-wrap;margin:0;font-size:13px;color:var(--text);background:transparent}
    footer{margin-top:14px;color:var(--muted);font-size:12px;text-align:right}

    /* responsive */
    @media (max-width:820px){
      .grid{grid-template-columns:1fr;align-items:start}
      footer{text-align:left}
    }
  </style>
</head>
<body>
  <div class="wrap" role="main">
    <header>
      <div class="logo">JS</div>
      <div>
        <h1>Prueba autocontenida — Node.js + HTML</h1>
        <p class="lead">Un único archivo. Haz pruebas, envía datos al servidor y muestra la respuesta.</p>
      </div>
    </header>

    <div class="grid">
      <section class="card">
        <h3>Enviar mensaje al servidor</h3>
        <div class="controls" style="margin-top:10px">
          <label for="nombre">Tu nombre</label>
          <input id="nombre" placeholder="Agustín Díaz" value="Agustín Díaz" />

          <label for="mensaje" style="margin-top:10px">Mensaje</label>
          <input id="mensaje" placeholder="Hola desde el cliente" value="Hola desde el cliente" />

          <button id="btnSend">Enviar y obtener respuesta</button>
        </div>
      </section>

      <aside class="card">
        <h4>Respuesta del servidor</h4>
        <div class="output" style="margin-top:10px">
          <pre id="out">Sin respuesta aún.</pre>
        </div>
        <footer>Servidor: <span id="srvInfo">desconocido</span></footer>
      </aside>
    </div>

    <div style="margin-top:18px;font-size:13px;color:var(--muted)">
      <strong>Nota:</strong> este HTML está embebido en el servidor Node.js (un único archivo). Para cambiar el puerto, exporta la variable de entorno <code>PORT</code>.
    </div>
  </div>

  <script>
    const out = document.getElementById('out');
    const srvInfo = document.getElementById('srvInfo');
    const btn = document.getElementById('btnSend');

    async function fetchServerInfo() {
      try {
        const res = await fetch('/api/info');
        const j = await res.json();
        srvInfo.textContent = j.server + ' · ' + j.time;
      } catch (e) {
        srvInfo.textContent = 'no disponible';
      }
    }

    btn.addEventListener('click', async () => {
      const nombre = document.getElementById('nombre').value;
      const mensaje = document.getElementById('mensaje').value;
      out.textContent = 'Enviando...';

      try {
        const res = await fetch('/api/echo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, mensaje })
        });
        const j = await res.json();
        out.textContent = JSON.stringify(j, null, 2);
      } catch (err) {
        out.textContent = 'Error al conectar con el servidor: ' + (err.message || err);
      }
    });

    // obtener info al cargar
    fetchServerInfo();
  </script>
</body>
</html>
`;

// servidor simple con 2 endpoints: / -> html ; /api/echo POST -> devuelve JSON ; /api/info -> info básica
const server = http.createServer((req, res) => {
  const { method, url } = req;
  
  if (url === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  
  if (url === '/api/info' && method === 'GET') {
    const info = {
      server: 'Node.js simple',
      pid: process.pid,
      time: new Date().toLocaleString('es-AR'),
      uptime_s: Math.round(process.uptime())
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(info));
  }
  
  if (url === '/api/echo' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const reply = {
          ok: true,
          received: data,
          serverTime: new Date().toISOString(),
          note: 'Prueba de echo en un solo archivo'
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(reply));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'JSON inválido' }));
      }
    });
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('No encontrado');
});

console.log("Servidor escuchando en http://localhost:" + PORT + " - Ctrl+C para salir");