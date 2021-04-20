const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const ingredienteSchema = new Schema ({
    ingrediente: String,    
});

const Ingrediente = mongoose.model('ingredientes', ingredienteSchema);

module.exports = Ingrediente;
