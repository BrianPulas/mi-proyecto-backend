// Archivo principal del servidor Node.js/Express (Refactorizado)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar Routers
const juegosRouter = require('./routes/juego');
const resenasRouter = require('./routes/reseña');
const axios = require('axios');

require('dotenv').config();

const app = express();
// Si usas variables de entorno, asegúrate de declararlas después de config()
const PORT = process.env.PORT || 3000;
// Ejemplo: const MONGO_URI = process.env.MONGO_URI;
const MONGODB_URL = 'mongodb+srv://jacobogarcesoquendo:aFJzVMGN3o7fA38A@cluster0.mqwbn.mongodb.net/BrandonGonzalez';

mongoose.connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conexión a MongoDB Atlas exitosa.'))
.catch(err => console.error('❌ Error de conexión a MongoDB:', err.message));
// --- (¡NUEVO!) RUTA PARA BUSCAR JUEGOS EN RAWG ---
// Ruta: /api/search-game/:title (mejora robustez y validación)
app.get('/api/search-game/:title', async (req, res) => {
  const raw = req.params.title || '';
  const title = encodeURIComponent(raw); // robustez ante caracteres especiales
  const API_KEY = process.env.RAWG_API_KEY;

  if (!API_KEY) {
    // Si falta la clave, devuelve 500 controlado con mensaje claro
    return res.status(500).json({ message: "RAWG_API_KEY no está configurado" });
  }

  const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${title}&page_size=5`;

  try {
    const response = await axios.get(url);
    const games = response.data?.results || [];
    const cleanedGames = games.map(game => ({
      id: game.id,
      name: game.name,
      background_image: game.background_image,
      released: game.released ? game.released.split('-')[0] : 'N/A',
    }));
    res.json(cleanedGames);
  } catch (error) {
    console.error("Error al buscar en RAWG:", error.message);
    // Devuelve 502 para distinguir error externo
    res.status(502).json({ message: "Error al contactar la API externa." });
  }
});

// Middleware
app.use(cors()); // Permite solicitudes desde el frontend React
app.use(bodyParser.json());

// --- MONTAJE DE RUTAS ---
app.use('/api/juegos', juegosRouter);
app.use('/api/reseñas', resenasRouter);


// --- INICIO DEL SERVIDOR ---

app.listen(PORT, () => {
    console.log(`🚀 Servidor Express para PLUS ULTRA corriendo en http://localhost:${PORT}`);
});