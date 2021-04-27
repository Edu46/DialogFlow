const express = require('express');
const router = express.Router();

const Tamanio = require('../models/tamanio');
const Ingrediente = require('../models/ingredientes');
const pedidoDialog = require('../models/pedidosDialog');
const Sesion = require('../models/sesion');

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
                resolve(arrayIngedientesDB, data);
            })

        }catch(error){
            reject(error);
        }
    })
}

function ingredientesBD(){
    return new Promise((resolve, reject) =>{
        try{
            Ingrediente.find()
            .then(data =>{
                resolve(data);
            })
            
        }catch(error){
            reject(error);
        }
    })
}

//Crear pedido DialogFlow
function guardarPedidosDialog(pedido){
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

function obtenerPedidos(id){
    return new Promise((resolve, reject) =>{
        try{
            pedidoDialog.findOne({_id: id})
            .then(data =>{
                resolve(data);
            })
            
        }catch(error){
            reject(error);
        }
    }) 
}

//---> SESION

//Crear Sesion
function guardarSesion(SesionObject){
    const newSesion= new Sesion(SesionObject);
    return new Promise((resolve, reject) =>{
        try{
            newSesion.save()
            .then(data =>{
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

//Obtener Sesion
function obtenerSesion(session){
    return new Promise((resolve, reject) =>{
        try{
            Sesion.findOne({session: session})
            .then(data =>{
                resolve(data);
            })
            
        }catch(error){
            reject(error);
        }
    }) 
}

async function editarSesion(SesionObject){
    return new Promise((resolve, reject) =>{
        const session = SesionObject.session;
        const body = SesionObject
        try{
            Sesion.findOneAndUpdate(session, body, {useFindAndModify: false})
            .then(data =>{
                resolve(data);
            }).catch(error =>{
                reject(error);
            });

        }catch(error){
            reject(error);
        }
    })
}
module.exports = {obtenerTamanios, ingredientes, guardarPedidosDialog, ingredientesBD, obtenerPedidos, editarSesion, obtenerSesion, guardarSesion};

