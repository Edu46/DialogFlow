const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const tamanioSchema = new Schema ({
    tamano: String,    
});

const Tamanio = mongoose.model('tamanos', tamanioSchema);

module.exports = Tamanio;
