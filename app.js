
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');


//mongodb models
const servicio = require('./router/servicios');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());

require('dotenv').config();

const port = process.env.PORT || 3000;

//Conexión a base de datos
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.iqym7.mongodb.net/${process.env.BDNAME}?retryWrites=true&w=majority`;

mongoose.connect(uri, 
    {useNewUrlParser: true, useUnifiedTopology: true}
).then(() => console.log('Base de datos conectada')

).catch(e => console.log(e));


//Dialo fLow-------------------------------------------------------------------------------------------------------------

//Endpoint exposed to DialogFlow
app.post('/', express.json(), (req, res) => {

    //Agent is initialized
    const agent = new WebhookClient({ request:req, response:res });

    //Logs to know whats is happen
    console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

    function welcome(agent) {
        agent.add(`Hola  👋 !!, Bienvenido a Edd´s Pizza. 🍕`);
        agent.add(`Cual es tu nombre?`);
        agent.context.set({
            'name':'name-user',
            'lifespan': 3,
        })
    }

    async function obtainName(agent){
        const name = agent.context.get('name-user');
        agent.add(`Saludos ${agent.parameters.name.name}`);
        agent.add(`Es correcto tu nombre?`);

        agent.context.set({name:'awaiting-name-user', lifespan: 2,});
        agent.add(new Suggestion(`Sí`));
        agent.add(new Suggestion(`No`));

    }

    async function obtainNameAll(agent){
        const name = agent.context.get('name-user');
        agent.add(`Saludos ${agent.parameters.name}`);
        agent.add(`Es correcto tu nombre?`);

        agent.context.set({name:'awaiting-name-user', lifespan: 2,})

        agent.add(new Suggestion(`Sí`));
        agent.add(new Suggestion(`No`));

    }

    
    function obtainNameNo(agent){
        const name = agent.context.get('name-user');
        agent.add(`No hay problema, puedes repetir tu nombre por favor?`);
        agent.context.set({name:'name-user', lifespan: 3,
            parameters: {
                nameParameter: agent.parameters.name,
            }
        })
    }

    async function obtainNameYes(agent){
        agent.context.set({name:'awaiting-name-user', lifespan: 0,})
        agent.add(`Que tamaño de Pizza desea ordenar? 🙇`);
        const tamaniosPizza = await servicio.obtenerTamanios();
        for(let tamanioPizza of tamaniosPizza){
            agent.add(new Suggestion(tamanioPizza));
        } 

    }

    function sizePizza(agent) {
        const context = agent.context.get('name-user');
        agent.context.set({
            'name':'size-pizza',
            'lifespan': 2,
            'parameters':{
                'tamano':agent.parameters.tamano,
                'name': context.parameters.name
            }
        });
        agent.context.set({name: 'name-user', lifespan:0});
        agent.add(`Genial ! 👏`);
        agent.add(`Todas nuestras  Pizzas cuentan con el mejor queso 🧀 y salsa 🍅 Italiana 👌, 
        deseas ver la lista de ingredientes? 🙇`);
        
        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
        
    }

    async function ingredientsYes(agent){
        //Añadir validacion de ingrediente no disponible
        const context = agent.context.get('size-pizza');
        const ingredientes = await servicio.ingredientes();
        console.log(context);
        agent.add(`Estos son los disponibles: ${ingredientes}`);
        agent.context.set({
            'name':'ingredients-pizza',
            'lifespan': 2,
            'parameters':{
              'ingredientes':agent.parameters.ingrediente,
              'tamano':context.parameters.tamano,
              'name': context.parameters.name
              
            }
        });
    }

    function ingredientsNo(agent){
        const context = agent.context.get('size-pizza');
        //Añadir validacion de ingrediente no disponible
        agent.add(`Que ingrediente deseas?`);

        agent.context.set({
            'name':'ingredients-pizza',
            'lifespan': 2,
            'parameters':{
              'ingredientes':agent.parameters.ingrediente,
              'tamano':context.parameters.tamano,
              'name': context.parameters.name
              
            }
        });
    }

    function ingredientsPizza(agent){
        agent.add(`Excelente decisión:`);
        const context = agent.context.get('ingredients-pizza');
        agent.add(`${context.parameters.any}`);
        console.log(context);
        agent.add(`Pizza lista!!, me podrias ayudar proporcionando los siguientes datos por favor? 😀`);
        agent.add(`Dirección :`);
    
    }

    function obtainedAddress(agent){
        const ingredientesContext = agent.context.get('ingredients-pizza');
        
        agent.add(`Tu dirección es ${agent.query}.`);
        agent.add(`¿Es correcto?`);

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));

        agent.context.set({
            'name':'awaiting-address',
            'lifespan': 3,
            'parameters':{
              'location':agent.query,
              'name': ingredientesContext.parameters.name,
              'tamano': ingredientesContext.parameters.tamano,
              'ingredientes': ingredientesContext.parameters.ingredientes,              
              }
        });
    }

    function obtainedAddressYes(agent){
        const domicilioContext = agent.context.get('awaiting-address');

        agent.add(`¿Me podrías ayudar proporcionando los siguientes datos por favor? 😀`);
        agent.add(`Telefono :`);

        agent.context.set({
            'name':'obtained-address',
            'lifespan': 3,
            'parameters':{
              'name': domicilioContext.parameters.name,
              'tamano': domicilioContext.parameters.tamano,
              'ingredientes': domicilioContext.parameters.ingredientes,
              'location':domicilioContext.domicilioContext.parameters.location
              }
        });
    }

    function obtainedAddressNo(agent){
        const domicilioContext = agent.context.get('awaiting-address');

        agent.add(`No hay problema, ¿me podrías proporcionar tu dirección?`);

        agent.context.set({
            'name':'ingredientes-pizza',
            'lifespan': 3,
            'parameters':{
                'name': domicilioContext.parameters.name,
                'tamano': domicilioContext.parameters.tamano,
                'ingredientes': domicilioContext.parameters.ingredientes                
                }
        });
    }

    function obtainedNumber(agent){
        const domicilioContext = agent.context.get('obtained-address');

        agent.add(`Tu número telefónico es ${agent.parameters['phone-number']}`);
        agent.add(`¿Es correcto?`);

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));

        agent.context.set({
            'name':'awaiting-obtained-number',
            'lifespan': 3,
            'parameters':{
              'name': domicilioContext.parameters.name,
              'tamano': domicilioContext.parameters.tamano,
              'ingredientes': domicilioContext.parameters.ingredientes,
              'location':domicilioContext.parameters.location,
              'number': agent.parameters['phone-number']
              }
        });
    }

    function obtainedNumberYes(agent){
        const numberContext = agent.context.get('awaiting-obtained-number');

        agent.context.set({
            'name': 'obtained-number',
            'lifespan':5,
            'parameters':{
              'name': numberContext.parameters.name,
              'tamano': numberContext.parameters.tamano,
              'ingredientes': numberContext.parameters.ingredientes,
              'location':numberContext.parameters.location,
              'number': numberContext.parameters.number
            }
        });
        
        agent.add(`Listo!! tu Pizza llegará pronto... 🙌`);

        agent.add(`Por último me gustaría confirmar tu pedido...  👨‍🍳`);

        agent.add(`Tamaño 🍕 : ${numberContext.parameters.tamano}`);
        agent.add(`Ingredientes 🧾 : ${numberContext.parameters.ingredientes}`);
        agent.add(`Dirección 🏡 : ${numberContext.parameters.location}`);
        agent.add(`Numero de contacto 📱 : ${numberContext.parameters.number}`);
    }

    function obtainedNumberNo(agent){
        const numberContext = agent.context.get('awaiting-obtained-phone');

        agent.add(`No hay problema, ¿me podrías proporcionar tu número telefónico?`);

        agent.context.set({
            'name':'obtained-address',
            'lifespan': 3,
            'parameters':{
                'name': numberContext.parameters.name,
                'tamano': numberContext.parameters.tamano,
                'ingredientes': numberContext.parameters.ingredientes,  
                'location':numberContext.parameters.location              
                }
        });
    }

    //Lomas de las palmas 456 sentido comumo int 6 guadalajara jalisco

    async function addressYes(agent){
        const numberContext = agent.context.get('obtained-phone');
        agent.add(`Listo, llegará en unos minutos tu Pizza`)

        // const tamano = agent.context.get('tamano-pizza');
        // const ingrediente = agent.context.get('ingredientes-pizza');
        // const numero = agent.context.get('obtener-numero');
        // const direccion = agent.context.get('domicilio-obtenido');

        const pedido = {
            tamano: numberContext.parameters.tamano,
            ingrediente: numberContext.parameters.ingredientes,
            direccion: numberContext.parameters.location,
            numero: numberContext.parameters.number,
        }
    }
    //     const pedidoBD = await servicio.guardarPedidosDialog(pedido);
    //     console.log(pedidoBD + 'return de bd');
    //     agent.add(`Tu id de orden es la: ${pedidoBD._id}`);



    // }

    // function addressNo(agent){
    //     agent.add(`Para modificar tu pedido puedes repetir los ingredientes, la dirección o el tamaño por el que deseas cambiar`);
    // }

    function fallback(agent) {
        agent.add(`Lo siento, puedes intentar de nuevo?`);
    }

    // async function updateIngredients(){
    //     const ingredientesBD = await servicio.ingredientesBD();
    //     const pedidoBD = await servicio.obtenerPedidos();

    //     let cantidad = 0;

    //     console.log(pedidoBD);
    //     console.log(ingredientesBD);

    //     for(let i=0; i<= pedidoBD.ingrediente.length-1; i++){
    //         let  ingrediente = pedidoBD.ingrediente[i];
    //         for(let i=0; i<= ingredientesBD.length-1; i++){
    //             if(ingrediente == ingredientesBD[i].ingrediente){
    //                 cantidad = ingredientesBD[i].cantidad - 1;
    //                 const ingredienteUpdate = {
    //                     id: ingredientesBD[i]._id,
    //                     ingrediente: ingredientesBD[i].ingrediente,   
    //                     cantidad: cantidad 
    //                 }
    //                 console.log(ingredienteUpdate);
    //             }
    //         }
    //     }
    // }


    let intentMap = new Map();
    intentMap.set('welcome.client', welcome);
    intentMap.set('name.user.obtained', obtainName);
    intentMap.set('name.user.obtained.catch.all', obtainNameAll);
    intentMap.set('name.user.obtained - yes', obtainNameYes);
    intentMap.set('name.user.obtained - no', obtainNameNo);
    intentMap.set('pizza.size.obtained', sizePizza);
    intentMap.set('ingredients - yes',ingredientsYes);
    intentMap.set('ingredients', ingredientsPizza);
    intentMap.set('ingredients - no',ingredientsNo);
    intentMap.set('address.obtained', obtainedAddress);
    intentMap.set('number.obtained',obtainedNumber),
    intentMap.set('address-yes',obtainedAddressYes);
    intentMap.set('address-no',obtainedAddressNo);
    intentMap.set('fallback.client', fallback);
    agent.handleRequest(intentMap);

  })

//-----------------------------------------------------------------------------------------------------------------------------

//motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//Middleware
app.use(express.static(__dirname + "/public"));

//Ruta web
app.use('/',require('./router/rutasWeb'));
app.use('/pedidos',require('./router/pedidos'));

app.use((req, res, next) =>{
    res.status('404').render("404",{
        titulo:"404",
        descripcion: "No encontrado"
    })
});

//Mensaje para funcionamiento del servidor
app.listen(port, () => {
    console.log(`servidor a su servicio en el puerto, ${port}`);
});