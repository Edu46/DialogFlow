const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const pedidoSchema = new Schema ({
    nombre: String,
    direccion: String,
    comentarioRepartidor: String,
    numero: String,
    chat: String,
    ingredientes: Array
});

const Pedido = mongoose.model('pedido', pedidoSchema);

module.exports = Pedido;
