const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    text: { 
        type: String, 
        required: true 
    },
    // Hacemos que la actividad tenga un enlace al juego
    gameId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Juego'  // IMPORTANTE: Asumo que tu modelo de juego se llama 'Juego'
    }, 
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Activity', activitySchema);