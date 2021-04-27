
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');


//mongodb models
const servicio = require('./router/servicios');
const { stringify } = require('actions-on-google/dist/common');

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
    const cantidadIngredientesPizza = {
        'Chica': 1,
        'Mediana': 2,
        'Grande': 3 
    }

    //Logs to know whats is happen
    console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

    function welcome(agent) {
        agent.add(`Hola  👋 !!, Bienvenido a Edd´s Pizza. 🍕`);
        agent.add(`Cual es tu nombre?`);
        agent.context.set({
            'name':'name-user',
            'lifespan': 1,
        })
    }

    async function obtainName(agent){
        const contextNameUser = agent.context.get('name-user');
        agent.add(`Saludos ${agent.parameters.name.name}`);
        agent.add(`Es correcto tu nombre?`);

        agent.context.set({name:'awaiting-name-user', lifespan: 2,
            parameters:{
                name: contextNameUser.parameters.name,
            }
        });

        agent.add(new Suggestion(`Sí`));
        agent.add(new Suggestion(`No`));

    }

    async function obtainNameAll(agent){
        const contextNameUser = agent.context.get('name-user');
        agent.add(`Saludos ${agent.parameters.name}`);
        agent.add(`Es correcto tu nombre?`);

        agent.context.set({name:'name-user', lifespan: 0,})
        agent.context.set({name:'awaiting-name-user', lifespan: 1,
            parameters:{
                name: contextNameUser.parameters.name,
            }
        });

        agent.add(new Suggestion(`Sí`));
        agent.add(new Suggestion(`No`));

    }

    
    function obtainNameNo(agent){
        const contextNameUser = agent.context.get('awaiting-name-user');
        agent.add(`No hay problema, puedes repetir tu nombre por favor?`);
        agent.context.set({name:'name-user', lifespan: 1,
            parameters: {
                name: contextNameUser.parameters.name,
            }
        })
    }

    async function obtainNameYes(agent){
        agent.context.set({name: 'name-user', lifespan:0});
        const contextNameUser = agent.context.get('awaiting-name-user');
        agent.context.set({
            name:'obtained-name-user', 
            lifespan: 1,
            parameters: {
                name: contextNameUser.parameters.name
            }
        })
        agent.add(`Que tamaño de Pizza desea ordenar? 🙇`);
        const tamaniosPizza = await servicio.obtenerTamanios();
        for(let tamanioPizza of tamaniosPizza){
            agent.add(new Suggestion(tamanioPizza));
        } 

    }

    async function sizePizza(agent) {
        const context = agent.context.get('obtained-name-user');

        agent.context.set({name: 'name-user', lifespan:0});
        agent.context.set({name: 'awaiting-name-user', lifespan:0});
        
        const tamaniosPizza = await servicio.obtenerTamanios();

        if(tamaniosPizza.includes(agent.parameters.tamano)){

            agent.add(`Genial! 👏`);
            agent.add(`Todas nuestras  Pizzas cuentan con el mejor queso 🧀 y salsa 🍅 Italiana 👌, 
            ¿deseas ver la lista de ingredientes? 🙇`);
            
            agent.context.set({
                name: 'size-pizza',
                lifespan: 1,
                parameters: {
                    'name': context.parameters.name,
                    'tamano': agent.parameters.tamano,                
                }
            })

            ////Código que se utilizaba cuándo se tenía que confirmar el tamaño de la pizza
            // agent.context.set({
            //     'name':'awaiting-size-pizza',
            //     'lifespan': 2,
            //     'parameters':{
            //         'name': context.parameters.name,
            //         'tamano':agent.parameters.tamano,
            //     }
            // });
            // agent.add(`Tu pizza será de tamaño ${agent.parameters.tamano}.`);
            // agent.add(`¿Estás de acuerdo?`);
                        
            agent.add(new Suggestion('Sí'));
            agent.add(new Suggestion('No'));
        }
        else{
            agent.add(`Lo siento, los tamaños disponibles son los siguientes ${tamaniosPizza}`);
            agent.add(`Que tamaño de Pizza desea ordenar? 🙇`);
            for(let tamanioPizza of tamaniosPizza){
                agent.add(new Suggestion(tamanioPizza));
            }
            
            agent.context.set({
                name:'obtained-name-user', 
                lifespan: 1,
                parameters: {
                    name: context.parameters.name
                }
            })
        }   
    }

    // function sizePizzaYes(agent){
    //     const tamanoPizzaContext = agent.context.get('awaiting-size-pizza');

    //     agent.add(`Genial ! 👏`);
    //     agent.add(`Todas nuestras  Pizzas cuentan con el mejor queso 🧀 y salsa 🍅 Italiana 👌, 
    //     ¿deseas ver la lista de ingredientes? 🙇`);
        
    //     agent.context.set({
    //         name: 'size-pizza',
    //         lifespan: 2,
    //         parameters: {
    //             'name': tamanoPizzaContext.parameters.name,
    //             'tamano':tamanoPizzaContext.parameters.tamano,                
    //         }
    //     })

    //     agent.add(new Suggestion('Sí'));
    //     agent.add(new Suggestion('No'));

    // }

    // async function sizePizzaNo(agent){
    //     const tamanoPizzaContext = agent.context.get('awaiting-size-pizza');
        
    //     agent.context.set({name:'awaiting-name-user', lifespan: 0,});
    //     agent.context.set({name: 'name-user', lifespan:0});

    //     agent.add(`Qué tamaño de Pizza desea ordenar? 🙇`);

    //     const tamaniosPizza = await servicio.obtenerTamanios();
    //     for(let tamanioPizza of tamaniosPizza){
    //         agent.add(new Suggestion(tamanioPizza));
    //     }
        
    //     agent.context.set({
    //         name:'obtained-name-user', 
    //         lifespan: 1,
    //         parameters: {
    //             name: tamanoPizzaContext.parameters.name
    //         }
    //     })
    // }

    async function showIngredientsYes(agent){
        //Añadir validacion de ingrediente no disponible
        const context = agent.context.get('size-pizza');
        const ingredientes = await servicio.ingredientes();

        const tamanoPizza  = context.parameters.tamano;
        let cantidadIngredientes = 0;

        for(pizza in cantidadIngredientesPizza){
            if(pizza == tamanoPizza){
                cantidadIngredientes = cantidadIngredientesPizza[pizza];
                break;
            }
        }

        agent.add(`Estos son los disponibles : ${ingredientes}`);
        if(cantidadIngredientes == 1 )
            agent.add(`¿Cuál sería el ingrediente de tu pizza?`);
        else
            agent.add(`¿Cuáles serían los ${cantidadIngredientes} ingredientes de tu pizza?`);

        agent.context.set({
            'name':'ingredients-pizza',
            'lifespan': 2,
            'parameters':{
              'tamano':context.parameters.tamano,
              'name': context.parameters.name
              
            }
        });
    }

    function showIngredientsNo(agent){
        const context = agent.context.get('size-pizza');
        
        const tamanoPizza  = context.parameters.tamano;
        let cantidadIngredientes = 0;

        for(pizza in cantidadIngredientesPizza){
            if(pizza == tamanoPizza){
                cantidadIngredientes = cantidadIngredientesPizza[pizza];
                break;
            }
        }

        if(cantidadIngredientes == 1 )
            agent.add(`¿Cuál sería el ingrediente de tu pizza?`);
        else
            agent.add(`¿Cuáles serían los ${cantidadIngredientes} ingredientes de tu pizza?`);
        
        agent.context.set({
            'name':'ingredients-pizza',
            'lifespan': 1,
            'parameters':{
                'name': context.parameters.name,
                'tamano':context.parameters.tamano,
            }
        });
    }

    async function ingredientsPizza(agent){
        const ingredientesContext = agent.context.get('ingredients-pizza');

        const ingredientesBD = await servicio.ingredientes();               //Ingredientes de la base de datos
        const ingredientesSeleccionados = agent.parameters.ingrediente;    //Ingredientes seleccionados por usuario
        
        let ingredientesNoDisponibles = [];                 //Array vacío para ingresar los ingredientes no disponibles

        //Iteración por cada ingrediente seleccionado por usuario
        for(let ingredienteSeleccionado of ingredientesSeleccionados){
            //Revisa si el ingrediente seleccionado está incluido en los ingredientes de la base de datos
            if(!ingredientesBD.includes(ingredienteSeleccionado)){
                ingredientesNoDisponibles.push(ingredienteSeleccionado);//Agrega ingrediente no disponible a arreglo
            }
        }
        
        //Si hay ingredientes no disponibles
        if(ingredientesNoDisponibles.length > 0){
            agent.add(`Lo sentímos, los siguientes ingredientes no están disponibles: ${ingredientesNoDisponibles}.`);
            agent.add(`Estos son los ingredientes disponibles: ${ingredientesBD}.`);
            agent.add(`Qué ingredientes deseas?`);

            agent.context.set({
                'name':'ingredients-pizza',
                'lifespan': 1,
                'parameters':{                  
                  'name': ingredientesContext.parameters.name,
                  'tamano': ingredientesContext.parameters.tamano,
                  }
            });
        }
        else{
            agent.add(`¿Estos son tus ingredientes seleccionados?`);            
            agent.add(`${ingredientesSeleccionados}`);            

            agent.context.set({
                'name':'awaiting-ingredients-pizza',
                'lifespan': 1,
                'parameters':{                  
                  'name': ingredientesContext.parameters.name,
                  'tamano': ingredientesContext.parameters.tamano,
                  'ingredientes': ingredientesSeleccionados              
                  }
            });

            agent.add(new Suggestion('Sí'));
            agent.add(new Suggestion('No'));

            agent.context.set({name: 'ingredients-pizza', lifespan:0});
        }        
    
    }

    function ingredientsPizzaYes(agent){
        const ingredientesContext = agent.context.get('awaiting-ingredients-pizza');
        agent.add(`Pizza lista!!, me podrias ayudar proporcionando los siguientes datos por favor? 😀`);
        agent.add(`Dirección :`);

        
        agent.context.set({
            'name':'obtained-ingredients',
            'lifespan': 2,
            'parameters':{                  
                'name': ingredientesContext.parameters.name,
                'tamano': ingredientesContext.parameters.tamano,
                'ingredientes': ingredientesContext.parameters.ingredientes 
            }
        });

        //agent.context.set({name: 'awaiting-ingredients-pizza', lifespan:0});
    }

    async function ingredientsPizzaNo(agent) {
        const ingredientesContext = agent.context.get('awaiting-ingredients-pizza');
        agent.add(`No hay problema, ¿me podrías decir que ingredientes deseas?`);

        const ingredientesBD = await servicio.ingredientes(); 
        agent.add(`Estos son los ingredientes disponibles: ${ingredientesBD}.`);
        
        agent.context.set({
            'name':'ingredients-pizza',
            'lifespan': 1,
            'parameters':{                  
                'name': ingredientesContext.parameters.name,
                'tamano': ingredientesContext.parameters.tamano,                             
            }
        });
    }

    function obtainedAddress(agent){
        const ingredientesContext = agent.context.get('obtained-ingredients');
        
        agent.add(`Tu dirección es ${agent.query}.`);
        agent.add(`¿Es correcto?`);
        // responder con YES revienta 
        agent.context.set({
            'name':'awaiting-address',
            'lifespan': 1,
            'parameters':{
              'location':agent.query,
              'name': ingredientesContext.parameters.name,
              'tamano': ingredientesContext.parameters.tamano,
              'ingredientes': ingredientesContext.parameters.ingredientes             
              }
        });

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));

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
              'location':domicilioContext.parameters.location
              }
        });
        agent.context.set({name: 'awaiting-address', lifespan:0});
    }

    function obtainedAddressNo(agent){
        const domicilioContext = agent.context.get('awaiting-address');
        agent.add(`No hay problema, ¿me podrías proporcionar tu dirección?`);
        agent.context.set({
            'name':'obtained-ingredients',
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

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
    }

    async function obtainedNumberYes(agent){
        const numberContext = agent.context.get('awaiting-obtained-number');

        // agent.context.set({
        //     'name': 'obtained-number',
        //     'lifespan':5,
        //     'parameters':{
        //       'name': numberContext.parameters.name,
        //       'tamano': numberContext.parameters.tamano,
        //       'ingredientes': numberContext.parameters.ingrediente,
        //       'location':numberContext.parameters.location,
        //       'number': numberContext.parameters.number
        //     }
        // });

        agent.add(`Listo!! tu Pizza llegará pronto... 🙌`);

        agent.add(`Nombre 😀 : ${numberContext.parameters.name}`)
        agent.add(`Tamaño 🍕 : ${numberContext.parameters.tamano}`);
        agent.add(`Ingredientes 🧾 : ${numberContext.parameters.ingredientes}`);
        agent.add(`Dirección 🏡 : ${numberContext.parameters.location}`);
        agent.add(`Numero de contacto 📱 : ${numberContext.parameters.number}`);

        const pedido = {
            name: numberContext.parameters.name,
            tamano: numberContext.parameters.tamano,
            ingrediente: numberContext.parameters.ingredientes,
            direccion: numberContext.parameters.location,
            numero: numberContext.parameters.number,
        }
        console.log(pedido);

        const pedidoBD = await servicio.guardarPedidosDialog(pedido);
        console.log(pedidoBD + 'return de bd');
        agent.add(`Tu id de orden es la: ${pedidoBD._id}`);

        agent.context.set({name: 'awaiting-obtained-number', lifespan:0});

        agent.context.set({name:'user-exit', 
            lifespan: 1,
            'parameters':{
                'id': pedidoBD._id
            }
        });

        agent.add('Deseas realizar otra orden?');

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
    }
    
    function obtainedNumberNo(agent){
        const numberContext = agent.context.get('awaiting-obtained-number');

        agent.add(`No hay problema, ¿me podrías proporcionar tu número telefónico?`);

        agent.context.set({
            'name':'obtained-address',
            'lifespan': 3,
            'parameters':{
                'name': numberContext.parameters.name,
                'tamano': numberContext.parameters.tamano,
                'ingredientes': numberContext.parameters.ingrediente,  
                'location':numberContext.parameters.location              
                }
        });
    }


    async function obtainexitYes(agent){
        const exitContext = agent.context.get('user-exit');
        const orderBD = await servicio.obtenerPedidos(exitContext.parameters.id); //Usuario de la base de datos
        console.log(orderBD.name);  
        agent.context.set({
            name:'obtained-name-user', 
            lifespan: 1,
            parameters: {
                name: orderBD.name
            }
        })
        const tamaniosPizza = await servicio.obtenerTamanios();
        agent.add('Que tamaño de pizza desea?');
        for(let tamanioPizza of tamaniosPizza){
            agent.add(new Suggestion(tamanioPizza));
        }
    }

    function obtainexitNo(agent){
        agent.add('Hasta luego!');
        agent.context.set({name: 'user-exit', lifespan:0});
    }



    //Fallback

    async function fallback(agent) {
        agent.add(`Lo siento, no pude entender lo que me dijiste.`);

        const sessionId = agent.session;
        const session = await servicio.obtenerContexto(sessionId);

        switch (session.contextOutput){
            case 'awaiting-ingredients-pizza':
                agent.add(`¿Estos son tus ingredientes seleccionados?`);            
                agent.add(`${session.parameters.ingredientes}`);            

                agent.context.set({
                    'name':'awaiting-ingredients-pizza',
                    'lifespan': 1,
                    'parameters':{                  
                        'name': session.parameters.name,
                        'tamano': session.parameters.tamano,
                        'ingredientes': session.parameters.ingredientes              
                    }
                });

                agent.add(new Suggestion('Sí'));
                agent.add(new Suggestion('No'));
                break;
            case 'awaiting-address':
                agent.add(`Tu dirección es ${session.parameters.location}.`);
                agent.add(`¿Es correcto?`);

                agent.context.set({
                    'name':'awaiting-address',
                    'lifespan': 1,
                    'parameters':{
                        'name': session.parameters.name,
                        'tamano': session.parameters.tamano,
                        'ingredientes': session.parameters.ingredientes,
                        'location': session.parameters.location
                    }
                });

                agent.add(new Suggestion('Sí'));
                agent.add(new Suggestion('No'));
                break;
            case 'awaiting-obtained-number':
                agent.add(`Tu número telefónico es ${session.parameters.number}`);
                agent.add(`¿Es correcto?`);

                agent.context.set({
                    'name':'awaiting-obtained-number',
                    'lifespan': 1,
                    'parameters':{
                        'name': session.parameters.name,
                        'tamano': session.parameters.tamano,
                        'ingredientes': session.parameters.ingredientes,
                        'location':session.parameters.location,
                        'number': session.parameters.number
                    }
                });

                agent.add(new Suggestion('Sí'));
                agent.add(new Suggestion('No'));
                break;
            case 'user-exit':
                agent.add('¿Deseas realizar otra orden?');

                agent.context.set({
                    name:'user-exit', 
                    lifespan: 1,
                    'parameters':{
                        'id': session.parameters._id
                    }
                });                        
        
                agent.add(new Suggestion('Sí'));
                agent.add(new Suggestion('No'));
                break;
            default:
                agent.add(`Puedes regresar al inicio escribiendo 'Hola'`);
                break;
        }
    }

    async function fallbacksizePizza(agent) {
        agent.add(`Lo siento, no contamos con ese tamaño, me puedes repetir el tamaño por favor`);
        const tamaniosPizza = await servicio.obtenerTamanios();
        agent.add(`Estos son los tamaños disonibles: ${tamaniosPizza}`);
        const contextNameUser = agent.context.get('obtained-name-user');
        agent.context.set({
            name:'obtained-name-user', 
            lifespan: 2,
            parameters: {
                name: contextNameUser.parameters.name
            }
        })
    }

    async function fallbackIngredientsPizza(agent) {
        const ingredientsPizzaContext = agent.context.get('ingredients-pizza');
        agent.context.set({
            'name':'ingredients-pizza',
            'lifespan': 2,
            'parameters':{
              'tamano':ingredientsPizzaContext.parameters.tamano,
              'name': ingredientsPizzaContext.parameters.name
              
            }
        });
        agent.add(`Lo siento, no entiendo muy bien, me puedes repetir los ingredientes que deseas?`);
        const ingredientes = await servicio.ingredientes();
        agent.add(`Estos son los disponibles : ${ingredientes}`);
    }

    function fallbackObtainedAddress(agent) {
        const ingredientesContext = agent.context.get('obtained-ingredients');
        agent.context.set({
            'name':'obtained-ingredients',
            'lifespan': 2,
            'parameters':{                  
              'name': ingredientesContext.parameters.name,
              'tamano': ingredientesContext.parameters.tamano,
              'ingredientes': ingredientesContext.parameters.ingredientes              
              }
        });
        agent.add(`No entendí muy bien, ¿Me podrías repetir tu dirección?`);

    }

    function fallbackObtainedNumber(agent) {
        const domicilioContext = agent.context.get('obtained-address');
        agent.context.set({
            'name':'obtained-address',
            'lifespan': 2,
            'parameters':{
                'name': domicilioContext.parameters.name,
                'tamano': domicilioContext.parameters.tamano,
                'ingredientes': domicilioContext.parameters.ingredientes,
                'location':domicilioContext.parameters.location               
            }
        });
        agent.add(`No entendí muy bien, ¿Me podrías repetir tu número?`);
    }

    function fallbackname(agent) {
        const awaitingNameContext = agent.context.get('name-user');
        agent.context.set({
            'name':'name-user',
            'lifespan': 2,
        });
        agent.add(`No entendí muy bien, ¿Me podrías repetir tu nombre?`);
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
    intentMap.set('pizza.size.obtained - yes', sizePizzaYes);
    intentMap.set('pizza.size.obtained - no', sizePizzaNo);
    intentMap.set('ingredientsShow - yes', showIngredientsYes);
    intentMap.set('ingredients', ingredientsPizza);
    intentMap.set('ingredientsShow - no', showIngredientsNo);
    intentMap.set('ingredients - yes', ingredientsPizzaYes);
    intentMap.set('ingredients - no', ingredientsPizzaNo);
    intentMap.set('address.obtained', obtainedAddress);
    intentMap.set('address-yes', obtainedAddressYes);
    intentMap.set('address-no', obtainedAddressNo);
    intentMap.set('number.obtained', obtainedNumber);
    intentMap.set('number.obtained - yes', obtainedNumberYes);
    intentMap.set('number.obtained - no', obtainedNumberNo);
    intentMap.set('obtain.exit - yes', obtainexitYes);
    intentMap.set('obtain.exit - no', obtainexitNo);
    intentMap.set('Fallback.global', fallback);
    intentMap.set('Fallback.sizePizza', fallbacksizePizza);
    intentMap.set('Fallback.ingredientsPizza', fallbackIngredientsPizza);
    intentMap.set('Fallback.obtainedAddress', fallbackObtainedAddress);
    intentMap.set('Fallback.obtainedNumber', fallbackObtainedNumber);
    intentMap.set('Fallback.name', fallbackname);
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