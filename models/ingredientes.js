const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const ingredienteSchema = new Schema ({
    ingrediente: String,   
    cantidad: Number 
});

const Ingrediente = mongoose.model('ingrediente', ingredienteSchema);

module.exports = Ingrediente;
