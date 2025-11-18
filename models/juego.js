// backend/models/Juego.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// (Asumo que tu esquema de Juego se ve así)
const juegoSchema = new Schema({
    titulo: { type: String, required: true },
    genero: { type: String, required: true },
    plataforma: { type: String, required: true },
    añoLanzamiento: { type: Number },
    desarrollador: { type: String },
    imagenPortada: { type: String },
    descripcion: { type: String },
    completado: { type: Boolean, default: false },
    
    // --- ¡NUEVOS CAMPOS ESTILO STEAM! ---
    totalHorasJugadas: {
        type: Number,
        default: 0
    },
    puntuacionMedia: {
        type: Number,
        default: 0
    },
    logrosObtenidos: {
        type: Number,
        default: 0
    },
    logrosTotales: {
        type: Number,
        default: 0
    }
    // --- Fin de los campos nuevos ---

}, { timestamps: true });

module.exports = mongoose.model('Juego', juegoSchema);