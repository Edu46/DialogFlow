const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const pedidosSchema = new Schema ({
    tamano: String,
    ingrediente: Array,
    direccion: String,
    numero: Number,
    name: String

});

const pedidoDialog = mongoose.model('pedidos', pedidosSchema);

module.exports = pedidoDialog;