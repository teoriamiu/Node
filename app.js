const express = require("express");
const path = require("path");
const app = express();

// Render asigna automáticamente el puerto
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos (si algún día agregás más)
app.use(express.static(__dirname));

// Ruta principal que devuelve el HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto " + PORT);
});