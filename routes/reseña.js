// backend/routes/reseña.js

const router = require('express').Router();
const Reseña = require('../models/Reseña');
const Juego = require('../models/juego');
const Activity = require('../models/Activity');

// --- ¡NUEVA FUNCIÓN HELPER! ---
// Esta función recalcula las estadísticas de un juego
const updateGameStats = async (juegoId) => {
    try {
        // 1. Busca todas las reseñas de este juego
        const reseñas = await Reseña.find({ juegoId: juegoId });

        if (reseñas.length === 0) {
            // Si no hay reseñas, resetea las stats
            await Juego.findByIdAndUpdate(juegoId, {
                totalHorasJugadas: 0,
                puntuacionMedia: 0
            });
            return;
        }

        // 2. Calcula el total de horas y la puntuación media
        const totalHoras = reseñas.reduce((acc, r) => acc + (r.horasJugadas || 0), 0);
        const mediaPuntuacion = reseñas.reduce((acc, r) => acc + (r.puntuacion || 0), 0) / reseñas.length;

        // 3. Actualiza el documento principal del Juego
        await Juego.findByIdAndUpdate(juegoId, {
            totalHorasJugadas: totalHoras,
            puntuacionMedia: mediaPuntuacion.toFixed(1) // Guarda con 1 decimal
        });

    } catch (err) {
        console.error(`Error actualizando stats para el juego ${juegoId}:`, err.message);
    }
};


// --- (¡MODIFICADO!) Ruta POST para crear reseña ---
router.post('/', async (req, res) => {
    try {
        const newReseña = new Reseña(req.body);
        await newReseña.save();
        
        // --- Creamos la Actividad ---
        const reseñaJuego = await Juego.findById(req.body.juegoId);
        const activity = new Activity({ 
            text: `Alguien dejó una reseña de ${newReseña.puntuacion} estrellas para ${reseñaJuego.titulo}`, 
            gameId: reseñaJuego._id 
        });
        await activity.save();

        // --- ¡ACTUALIZAMOS LAS STATS DEL JUEGO! ---
        await updateGameStats(req.body.juegoId);
        
        res.status(201).json(newReseña);
    } catch (err) {
        console.error("Error en POST /api/reseñas:", err.message);
        res.status(400).json({ message: "Error al agregar reseña", error: err.message });
    }
});


// --- (¡MODIFICADO!) Ruta DELETE para borrar reseña ---
router.delete('/:id', async (req, res) => {
    try {
        const reseñaBorrada = await Reseña.findByIdAndDelete(req.params.id);
        
        if (!reseñaBorrada) {
            return res.status(404).json({ message: "Reseña no encontrada" });
        }

        // --- ¡ACTUALIZAMOS LAS STATS DEL JUEGO! ---
        // (Cuando borras una reseña, hay que recalcular)
        await updateGameStats(reseñaBorrada.juegoId);

        res.json({ message: "Reseña eliminada" });
    } catch (err) {
        console.error("Error en DELETE /api/reseñas/:id:", err.message);
        res.status(400).json({ message: "Error al eliminar reseña", error: err.message });
    }
});


// (Puedes añadir la misma lógica de updateGameStats() a tu ruta PUT si permites editar reseñas)

// Ruta para OBTENER todas las reseñas de un juego
router.get('/juego/:juegoId', async (req, res) => {
    try {
        const reseñas = await Reseña.find({ juegoId: req.params.juegoId })
            .sort({ createdAt: -1 });
        res.json(reseñas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener reseñas", error: err.message });
    }
});

module.exports = router;