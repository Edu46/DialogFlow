const express = require('express');
const router = express.Router();

//Rutas express
router.get('/', (req, res) =>{
    res.render("index", {titulo : "mi titulo dinámico"});
});

//Rutas express
router.get('/servicios', (req, res) =>{
    res.render("servicios", {tituloDeServicios : "mi titulo dinamico de servicios"});
});

module.exports = router;