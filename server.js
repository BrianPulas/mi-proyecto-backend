const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

// Configuración de variables de entorno (Lo primero siempre)
require('dotenv').config();

// Importar Modelos
const Activity = require('./models/Activity'); 
const Juego = require('./models/juego');
const Reseña = require('./models/reseña');

// Importar Routers
const juegosRouter = require('./routes/juego');
const resenasRouter = require('./routes/reseña');
const authRouter = require('./routes/auth');
const friendsRouter = require('./routes/friends');

// Inicializar App
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. MIDDLEWARES (Configuración Global)
// ==========================================
// Es CRUCIAL que esto vaya antes de las rutas

// Permite solicitudes desde cualquier origen (Frontend)
app.use(cors()); 

// Procesa el cuerpo de las peticiones JSON
app.use(bodyParser.json()); 

// --- CORRECCIÓN IMÁGENES: Servir archivos estáticos ---
// Le dice a Express: "Cuando pidan algo en /uploads, búscalo en la carpeta física 'uploads'"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==========================================
// 2. CONEXIÓN A BASE DE DATOS
// ==========================================
const MONGODB_URL = 'mongodb+srv://jacobogarcesoquendo:aFJzVMGN3o7fA38A@cluster0.mqwbn.mongodb.net/brandonnahuelgonzalezalvez';

mongoose.connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conexión a MongoDB Atlas exitosa.'))
.catch(err => console.error('❌ Error de conexión a MongoDB:', err.message));


// ==========================================
// 3. RUTAS PERSONALIZADAS (API)
// ==========================================

// Buscar juegos en RAWG
app.get('/api/search-game/:title', async (req, res) => {
  const raw = req.params.title || '';
  const title = encodeURIComponent(raw); 
  const API_KEY = process.env.RAWG_API_KEY;

  if (!API_KEY) {
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
    res.status(502).json({ message: "Error al contactar la API externa." });
  }
});

// Feed de Actividad
app.get('/api/feed', async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ timestamp: -1 }) 
            .limit(20)
            .populate('gameId', 'titulo'); 
            
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: "Error al cargar el feed", error: err.message });
    }
});

// Estadísticas del Dashboard
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const gameStats = await Juego.aggregate([
            {
                $group: {
                    _id: null, 
                    totalJuegos: { $sum: 1 },
                    completados: { 
                        $sum: { $cond: ["$completado", 1, 0] } 
                    },
                    totalHoras: { $sum: "$totalHorasJugadas" },
                    totalLogrosObtenidos: { $sum: "$logrosObtenidos" },
                    totalLogrosPosibles: { $sum: "$logrosTotales" }
                }
            }
        ]);

        const plataformaStats = await Juego.aggregate([
            { $group: { _id: "$plataforma", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const generoStats = await Juego.aggregate([
            { $group: { _id: "$genero", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const reseñaStats = await Juego.aggregate([
            {
                $group: {
                    _id: null,
                    mediaPuntuacion: { $avg: "$puntuacionMedia" }
                }
            }
        ]);

        const stats = {
            totalJuegos: gameStats[0]?.totalJuegos || 0,
            completados: gameStats[0]?.completados || 0,
            plataformas: plataformaStats,
            generos: generoStats,
            mediaPuntuacion: reseñaStats[0]?.mediaPuntuacion || 0,
            totalHoras: gameStats[0]?.totalHoras || 0,
            totalLogrosObtenidos: gameStats[0]?.totalLogrosObtenidos || 0,
            totalLogrosPosibles: gameStats[0]?.totalLogrosPosibles || 0,
        };

        res.json(stats);

    } catch (err) {
        console.error("Error al generar estadísticas:", err.message);
        res.status(500).json({ message: "Error al generar estadísticas", error: err.message });
    }
});

// ==========================================
// 4. MONTAJE DE RUTAS SECUNDARIAS
// ==========================================
app.use('/api/juegos', juegosRouter);
app.use('/api/reseñas', resenasRouter);
app.use('/api/auth', authRouter);
app.use('/api/friends', friendsRouter);

// ==========================================
// 5. INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor Express para PLUS ULTRA corriendo en http://localhost:${PORT}`);
});