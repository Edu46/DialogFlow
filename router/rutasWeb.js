const express = require('express');
const router = express.Router();

//Rutas express
router.get('/', (req, res) =>{
    res.render("index", {titulo : "mi titulo dinámico"});
});

module.exports = router;