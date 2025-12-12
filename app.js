const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔥 NUEVA RUTA
app.get("/hola", (req, res) => {
  const nombre = req.query.nombre || "visitante";
  res.send(`Hola ${nombre}, tu servidor funciona!`);
});

app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto " + PORT);
});