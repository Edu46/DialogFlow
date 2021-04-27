const  mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const sesionSchema = new Schema ({
    session: String,
    contextInput: String,
    contextOutput: String,
    parameters: Object
});

const Sesion = mongoose.model('sesion', sesionSchema);

module.exports = Sesion;