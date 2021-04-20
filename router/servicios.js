const express = require('express');
const router = express.Router();

const Tamanio = require('../models/tamanio');
const Ingrediente = require('../models/ingredientes');
const pedidoDialog = require('../models/pedidosDialog');

function obtenerTamanios(){
    return new Promise ((resolve, reject) =>{
        try{
            Tamanio.find()
            .then(data =>{
                const arrayTamanioDB = [];
                for(let i=0; i<=data.length-1; i++){
                    arrayTamanioDB[i] = data[i].tamano;
                }
                resolve(arrayTamanioDB);
            })
        }catch(error){
            reject(error);
            console.log(error);
        } 
    });
};

function ingredientes(){
    return new Promise((resolve, reject) =>{
        try{
            Ingrediente.find()
            .then(data =>{
                const arrayIngedientesDB = [];
                for(let i=0; i<=data.length-1; i++){
                    arrayIngedientesDB[i] = data[i].ingrediente;
                }
                resolve(arrayIngedientesDB);
            })

        }catch(error){
            reject(error);
        }
    })
}

//Crear pedido DialogFlow



function guardarPedidosDialog(pedido){
    console.log(pedido);
    const newPedido = new pedidoDialog(pedido);
    return new Promise((resolve, reject) =>{
        try{
            newPedido.save()
            .then(data =>{
                //console.log(data);
                // const arrayIngedientesDB = [];
                // for(let i=0; i<=data.length-1; i++){
                //     arrayIngedientesDB[i] = data[i].ingrediente;
                // }
                // console.log(arrayIngedientesDB);
                resolve(data);
            }).catch(error => {
                reject(error);
            })

        }catch(error){
            reject(error);
            console.log(error);
        }
    })
}


module.exports = {obtenerTamanios, ingredientes, guardarPedidosDialog};

