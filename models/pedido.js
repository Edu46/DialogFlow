const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const pedidoSchema = new Schema ({
    ingrediente: Array,
    tamano: String,
    direccion: String,
    numero: String
});

const Pedido = mongoose.model('pedido', pedidoSchema);

module.exports = Pedido;
