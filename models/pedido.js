const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const pedidoSchema = new Schema ({
    tamano: String,
    ingrediente: Array,
    direccion: String,
    numero: Number,
    name: Array
});

const Pedido = mongoose.model('pedido', pedidoSchema);

module.exports = Pedido;
