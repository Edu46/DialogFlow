
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

    async function welcome(agent) {
        agent.add(`Hola  👋 !!, Bienvenido a Edd´s Pizza. 🍕 `);
        const tamaniosPizza = await servicio.obtenerTamanios();
        for(let tamanioPizza of tamaniosPizza){
            agent.add(new Suggestion(tamanioPizza));
        } 
        agent.context.set({
            'name':'tamano-pizza',
            'lifespan': 10,
            'parameters':{
              'tamano':agent.parameters.tamano,
              }
        });
        agent.add(`Cual es tu nombre?`);
    }

    function obtainName(agent){
        agent.context.set({
            'name':'obtain-name',
            'lifespan': 10,
            'parameters':{
              'tamano':agent.parameters.name,
            }
        })
        agent.add(`que tamaño de Pizza desea ordenar? 🙇`);
    }

    function sizePizza(agent) {
        agent.add(`Genial ! 👏`);
        agent.add(`Todas nuestras  Pizzas cuentan con el mejor queso 🧀 y salsa 🍅 Italiana 👌, deseas ver la lista de ingredientes? 🙇`);
        
        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
    }

    async function ingredientsYes(agent){
        //Añadir validacion de ingrediente no disponible
        const ingredientes = await servicio.ingredientes();
        agent.add(`Estos son los disponibles: ${ingredientes}`);
        agent.context.set({
            'name':'ingredientes-pizza',
            'lifespan': 10,
            'parameters':{
              'tamano':agent.parameters.ingrediente,
            }
        });

    }

    function ingredientsNo(agent){
        //Añadir validacion de ingrediente no disponible
        agent.add(`Que ingrediente deseas?`);
        agent.context.set({
            'name':'ingredientes-pizza',
            'lifespan': 10,
            'parameters':{
              'tamano':agent.parameters.ingrediente,
            }
        });
    }

    function ingredientsPizza(agent){
        agent.add(`Excelente decisión:`);
        const response = agent.context.get('ingredientes-pizza');
        agent.add(`${response.parameters.ingredinete}`);
        agent.add(`Pizza lista!!, me podrias ayudar proporcionando los siguientes datos por favor? 😀`);
        agent.add(`Dirección :`);
    
    }

    function obtainedAddress(agent){
        agent.context.set({
            'name':'domicilio-obtenido',
            'lifespan': 5,
            'parameters':{
              'location':agent.parameters['street-address'],
              }
        });
        agent.add(`Telefono :`);
    }

    function obtainedNumber(agent){
        agent.context.set({
            'name': 'obtener-numero',
            'lifespan':5,
            'parameters':{
                'numero': agent.parameters['phone-number'],
            }
        });
        
        agent.add(`Listo!! tu Pizza llegara pronto... 🙌`);

        agent.add(`Por ultimo me gustaria confirmar tu pedido...  👨‍🍳`);

        const tamano = agent.context.get('tamano-pizza');
        const ingrediente = agent.context.get('ingredientes-pizza');
        const  direccion = agent.context.get('domicilio-obtenido');

        agent.add(`Tamaño 🍕 : ${tamano.parameters.tamano}`);
        agent.add(`Ingredientes 🧾 : ${ingrediente.parameters.ingredinete}`);
        agent.add(`Dirección 🏡 : ${direccion.parameters.location['street-address'] + ' ' + direccion.parameters.location['subadmin-area']}`);
        agent.add(`Numero de contacto 📱 : ${agent.parameters['phone-number']}`)

        updateIngredients();

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
    }

    //Lomas de las palmas 456 sentido comumo int 6 guadalajara jalisco

    async function addressYes(agent){
        agent.add(`Listo, llegara en unos minutos tu Pizza`)

        const tamano = agent.context.get('tamano-pizza');
        const ingrediente = agent.context.get('ingredientes-pizza');
        const numero = agent.context.get('obtener-numero');
        const direccion = agent.context.get('domicilio-obtenido');

        const pedido = {
            tamano:tamano.parameters.tamano,
            ingrediente:ingrediente.parameters.ingredinete,
            direccion: direccion.parameters.location['street-address'] + ' ' + direccion.parameters.location['subadmin-area'],
            numero:numero.parameters.numero,
        }

        const pedidoBD = await servicio.guardarPedidosDialog(pedido);
        console.log(pedidoBD + 'return de bd');
        agent.add(`Tu id de orden es la: ${pedidoBD._id}`);



    }

    function addressNo(agent){
        agent.add(`Para modificar tu pedido puedes repetir los ingredientes, la dirección o el tamaño por el que deseas cambiar`);
    }

    function fallback(agent) {
        agent.add(`Lo siento, puedes intentar de nuevo?`);
    }

    async function updateIngredients(){
        const ingredientesBD = await servicio.ingredientesBD();
        const pedidoBD = await servicio.obtenerPedidos();

        let cantidad = 0;

        console.log(pedidoBD);
        console.log(ingredientesBD);

        for(let i=0; i<= pedidoBD.ingrediente.length-1; i++){
            let  ingrediente = pedidoBD.ingrediente[i];
            for(let i=0; i<= ingredientesBD.length-1; i++){
                if(ingrediente == ingredientesBD[i].ingrediente){
                    cantidad = ingredientesBD[i].cantidad - 1;
                    const ingredienteUpdate = {
                        id: ingredientesBD[i]._id,
                        ingrediente: ingredientesBD[i].ingrediente,   
                        cantidad: cantidad 
                    }
                    console.log(ingredienteUpdate);
                }
            }
        }
    }


    let intentMap = new Map();
    intentMap.set('welcome.client', welcome);
    intentMap.set('pizza.size.obtained', sizePizza);
    intentMap.set('ingredients-yes',ingredientsYes);
    intentMap.set('ingredients', ingredientsPizza);
    intentMap.set('ingredients-no',ingredientsNo);
    intentMap.set('address.obtained', obtainedAddress);
    intentMap.set('number.obtained',obtainedNumber),
    intentMap.set('address-yes',addressYes);
    intentMap.set('address-no',addressNo);
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