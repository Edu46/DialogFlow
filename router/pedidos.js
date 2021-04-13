const express = require('express');
const router = express.Router();

console.log('estas en pedidos.js');

const Pedido = require('../models/pedido');
const { route } = require('./rutasWeb');

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

router.get('/crear',(req,res) =>{
    res.render('crear')
})

//Create
router.post('/', async(req,res) =>{
    const cuerpo = req.body;
    try{
        const pedidoDB = new Pedido(cuerpo);
        await pedidoDB.save();
        console.log('pedido creado:', pedidoDB);
        res.redirect('/pedidos')
    }catch(error){
        console.log(error);
    }
});

//Get un solo documento
router.get('/:id', async(req,res) =>{
    const id = req.params.id;
    try{
        const pedidoDB = await Pedido.findOne({_id: id});
        res.render('detalle', {
            pedido: pedidoDB,
            error: false
        });
    }catch(error){
        console.log(error)
        res.render('detalle',{
            error:true,
            mensaje:'No se encuentra el id seleccionado'
        })
    }
})

router.delete('/:id', async(req,res) =>{
    const id = req.params.id;
    try{
        const pedidoBD = await Pedido.findByIdAndDelete({_id: id})
        if(pedidoBD){
            res.json({
                estado:true,
                mensaje: 'eliminado'
            })        
        }
    }catch(error){
        res.json({
            estado: false,
            mensaje: 'fallo al elminiar'
        })
    }
})

router.put('/:id', async(req, res) =>{
    const id = req.params.id;
    const body = req.body;
    try{
        const pedidoBD = await Pedido.findByIdAndUpdate(
            id, body, {useFindAndModify: false}
        );
        console.log(pedidoBD);
        res.json({
            estado:true,
            mensaje: 'Dato modificado'
        })


    }catch(error){
        console.log(error);
        res.json ({
            estado: false,
            mensaje: 'No fue posible modificar el dato'
        })
    }
})

module.exports = router;
