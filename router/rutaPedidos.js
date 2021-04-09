const express = require('express');
const router = express.Router();


const Pedido = require('../models/pedido');

router.get(('/'), async (req, res) => {
    try{
        const arrayPedidoDB = await Pedido.find();
        res.render("pedidos",{
            arrayPedidos: arrayPedidoDB 
        });
    }catch(error){
        console.log(error);
    }   
});

module.exports = router;
