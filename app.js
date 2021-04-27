
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
        agent.add(`¿Cuál es tu nombre?`);
        agent.context.set({
            'name':'name-user',
            'lifespan': 1,
        })
    }

    async function obtainName(agent){
        const contextNameUser = agent.context.get('name-user');
        agent.add(`Saludos ${agent.parameters.name.name}`);
        agent.add(`¿Es correcto tu nombre?`);

        agent.context.set({name:'awaiting-name-user', lifespan: 2,
            parameters:{
                name: contextNameUser.parameters.name.name,
                date: Date()
            }
        });

        agent.add(new Suggestion(`Sí`));
        agent.add(new Suggestion(`No`));

    }

    async function obtainNameAll(agent){
        const contextNameUser = agent.context.get('name-user');
        agent.add(`Saludos ${agent.parameters.name}`);
        agent.add(`¿Es correcto tu nombre?`);

        agent.context.set({name:'name-user', lifespan: 0,})
        agent.context.set({name:'awaiting-name-user', lifespan: 1,
            parameters:{
                name: contextNameUser.parameters.name[0],
                date: contextNameUser.parameters.date
            }
        });

        agent.add(new Suggestion(`Sí`));
        agent.add(new Suggestion(`No`));

    }

    
    function obtainNameNo(agent){
        const contextNameUser = agent.context.get('awaiting-name-user');
        agent.add(`No hay problema, escribe de nuevo tu nombre.`);
        agent.context.set({name:'name-user', lifespan: 1,
            parameters: {
                name: contextNameUser.parameters.name,
                date: contextNameUser.parameters.date

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
                name: contextNameUser.parameters.name,
                date: contextNameUser.parameters.date

            }
        })
        agent.add(`¿Qué tamaño de Pizza desea ordenar? 🙇`);        
        const tamaniosPizza = await servicio.obtenerTamanios();
        agent.add(`Estos son los tamaños: ${tamaniosPizza}`);
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

            ¿Deseas ver la lista de ingredientes? 🙇`);
            
            agent.context.set({
                name: 'size-pizza',
                lifespan: 1,
                parameters: {
                    'name': context.parameters.name,
                    'date': context.parameters.date,
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
            agent.add(`Lo siento, los tamaños disponibles son los siguientes ${tamaniosPizza}.`);
            agent.add(`¿Qué tamaño de Pizza desea ordenar? 🙇`);
            for(let tamanioPizza of tamaniosPizza){
                agent.add(new Suggestion(tamanioPizza));
            }
            
            agent.context.set({
                name:'obtained-name-user', 
                lifespan: 1,
                parameters: {
                    name: context.parameters.name,
                    date: context.parameters.date,
                }
            })
        }   
    }

    //--------------> Se quito para evitar que se pregunte 
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
              'date': context.parameters.date,
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
                'date': context.parameters.date,
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
            agent.add(`Lo sentimos, los siguientes ingredientes no están disponibles: ${ingredientesNoDisponibles}.`);
            agent.add(`Éstos son los ingredientes disponibles: ${ingredientesBD}.`);
            agent.add(`¿Qué ingredientes deseas?`);

            agent.context.set({
                'name':'ingredients-pizza',
                'lifespan': 1,
                'parameters':{                  
                  'name': ingredientesContext.parameters.name,
                  'date': ingredientesContext.parameters.date,
                  'tamano': ingredientesContext.parameters.tamano,
                  }
            });
        }
        else{
            agent.add(`¿Es correcta tu lista de ingredientes?`);            
            agent.add(`${ingredientesSeleccionados}`);            

            agent.context.set({
                'name':'awaiting-ingredients-pizza',
                'lifespan': 2,
                'parameters':{                  
                  'name': ingredientesContext.parameters.name,
                  'date': ingredientesContext.parameters.date,
                  'tamano': ingredientesContext.parameters.tamano,
                  'ingredientes': ingredientesSeleccionados              
                  }
            });

            const SesionObject = {
                session: agent.session,
                contextInput: 'ingredients-pizza',
                contextOutput: 'awaiting-ingredients-pizza',
                parameters: {
                    name: ingredientesContext.parameters.name,
                    date: ingredientesContext.parameters.date,
                    tamano: ingredientesContext.parameters.tamano,
                    ingredientes: ingredientesSeleccionados 
                }
            }
            servicio.guardarSesion(SesionObject);
            
            agent.add(new Suggestion('Sí'));
            agent.add(new Suggestion('No'));

            agent.context.set({name: 'ingredients-pizza', lifespan:0});
        }        
    
    }

    function ingredientsPizzaYes(agent){
        const ingredientesContext = agent.context.get('awaiting-ingredients-pizza');
        agent.add(`Pizza lista!!, ¿me podrías proporcionar los siguientes datos? 😀`);
        agent.add(`Dirección :`);

        
        agent.context.set({
            'name':'obtained-ingredients',
            'lifespan': 2,
            'parameters':{                  
                'name': ingredientesContext.parameters.name,
                'date': ingredientesContext.parameters.date,
                'tamano': ingredientesContext.parameters.tamano,
                'ingredientes': ingredientesContext.parameters.ingredientes 
            }
        });

        const SesionObject = {
            session: agent.session,
            contextInput: 'awaiting-ingredients-pizza',
            contextOutput: 'obtained-ingredients',
            parameters: {
                name: ingredientesContext.parameters.name,
                date: ingredientesContext.parameters.date,
                tamano: ingredientesContext.parameters.tamano,
                ingredientes: ingredientesContext.parameters.ingredientes 
            }
        }
        servicio.editarSesion(SesionObject);

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
                'date': ingredientesContext.parameters.date,
                'tamano': ingredientesContext.parameters.tamano,                             
            }
        });
    }

    function obtainedAddress(agent){
        const ingredientesContext = agent.context.get('obtained-ingredients');
        
        agent.add(`Tu dirección es ${agent.query}.`);
        agent.add(`¿Es correcto?`);
        agent.context.set({
            'name':'awaiting-address',
            'lifespan': 1,
            'parameters':{
              'location':agent.query,
              'name': ingredientesContext.parameters.name,
              'date': ingredientesContext.parameters.date,
              'tamano': ingredientesContext.parameters.tamano,
              'ingredientes': ingredientesContext.parameters.ingredientes             
              }
        });

        const SesionObject = {
            session: agent.session,
            contextInput: 'obtained-ingredients',
            contextOutput: 'awaiting-address',
            parameters: {
                'location':agent.query,
                'name': ingredientesContext.parameters.name,
                'date': ingredientesContext.parameters.date,
                'tamano': ingredientesContext.parameters.tamano,
                'ingredientes': ingredientesContext.parameters.ingredientes  
            }
        }
        servicio.editarSesion(SesionObject);

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));

    }

    function obtainedAddressYes(agent){
        const domicilioContext = agent.context.get('awaiting-address');
        agent.add(`¿Me podrías proporcionar el siguiente dato? 😀`);
        agent.add(`Teléfono:`);
        agent.context.set({
            'name':'obtained-address',
            'lifespan': 3,
            'parameters':{
              'name': domicilioContext.parameters.name,
              'date': domicilioContext.parameters.date,
              'tamano': domicilioContext.parameters.tamano,
              'ingredientes': domicilioContext.parameters.ingredientes,
              'location':domicilioContext.parameters.location
              }
        });

        const SesionObject = {
            session: agent.session,
            contextInput: 'awaiting-address',
            contextOutput: 'obtained-address',
            parameters: {
                'name': domicilioContext.parameters.name,
                'date': domicilioContext.parameters.date,
                'tamano': domicilioContext.parameters.tamano,
                'ingredientes': domicilioContext.parameters.ingredientes,
                'location':domicilioContext.parameters.location  
            }
        }
        servicio.editarSesion(SesionObject);

        agent.context.set({name: 'awaiting-address', lifespan:0});
    }

    function obtainedAddressNo(agent){
        const domicilioContext = agent.context.get('awaiting-address');
        agent.add(`No hay problema, escribe de nuevo tu dirección.`);
        agent.context.set({
            'name':'obtained-ingredients',
            'lifespan': 3,
            'parameters':{
                'name': domicilioContext.parameters.name,
                'date': domicilioContext.parameters.date,
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
              'date': domicilioContext.parameters.date,
              'tamano': domicilioContext.parameters.tamano,
              'ingredientes': domicilioContext.parameters.ingredientes,
              'location':domicilioContext.parameters.location,
              'number': agent.parameters['phone-number']
              }
        });

        const SesionObject = {
            session: agent.session,
            contextInput: 'obtained-address',
            contextOutput: 'awaiting-obtained-number',
            parameters: {
                'name': domicilioContext.parameters.name,
                'date': domicilioContext.parameters.date,
                'tamano': domicilioContext.parameters.tamano,
                'ingredientes': domicilioContext.parameters.ingredientes,
                'location':domicilioContext.parameters.location,
                'number': agent.parameters['phone-number'] 
            }
        }
        servicio.editarSesion(SesionObject);

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
    }

    async function obtainedNumberYes(agent){
        const numberContext = agent.context.get('awaiting-obtained-number');

        agent.add(`Listo!! tu Pizza llegará pronto... 🙌`);

        agent.add(`Nombre 😀 : ${numberContext.parameters.name}`)
        agent.add(`Tamaño 🍕 : ${numberContext.parameters.tamano}`);
        agent.add(`Ingredientes 🧾 : ${numberContext.parameters.ingredientes}`);
        agent.add(`Dirección 🏡 : ${numberContext.parameters.location}`);
        agent.add(`Número de contacto 📱 : ${numberContext.parameters.number}`);

        const pedido = {
            name: numberContext.parameters.name,
            date: numberContext.parameters.date,
            tamano: numberContext.parameters.tamano,
            ingrediente: numberContext.parameters.ingredientes,
            direccion: numberContext.parameters.location,
            numero: numberContext.parameters.number,
        }

        const pedidoBD = await servicio.guardarPedidosDialog(pedido);
        agent.add(`Tu número de orden es: ${pedidoBD._id}`);

        const SesionObject = {
            session: agent.session,
            contextInput: 'awaiting-obtained-number',
            contextOutput: 'user-exit',
            parameters: {
                name: numberContext.parameters.name,
                date: numberContext.parameters.date,
                tamano: numberContext.parameters.tamano,
                ingrediente: numberContext.parameters.ingredientes,
                direccion: numberContext.parameters.location,
                numero: numberContext.parameters.number,
                idPedido: pedidoBD._id
            }
        }
        servicio.editarSesion(SesionObject);

        agent.context.set({name: 'awaiting-obtained-number', lifespan:0});

        agent.context.set({name:'user-exit', 
            lifespan: 1,
            'parameters':{
                'idPedido': pedidoBD._id,
                'date': numberContext.parameters.date,
            }
        });

        agent.add('¿Deseas realizar otra orden?');

        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
    }
    
    function obtainedNumberNo(agent){
        const numberContext = agent.context.get('awaiting-obtained-number');

        agent.add(`No hay problema, escribe de nuevo tu número telefónico.`);

        agent.context.set({
            'name':'obtained-address',
            'lifespan': 3,
            'parameters':{
                'name': numberContext.parameters.name,
                'date': numberContext.parameters.date,
                'tamano': numberContext.parameters.tamano,
                'ingredientes': numberContext.parameters.ingrediente,  
                'location':numberContext.parameters.location              
                }
        });
    }


    async function obtainexitYes(agent){
        const exitContext = agent.context.get('user-exit');
        const orderBD = await servicio.obtenerPedidos(exitContext.parameters.id); //Usuario de la base de datos
        agent.context.set({
            name:'obtained-name-user', 
            lifespan: 1,
            parameters: {
                name: orderBD.name,
                date: exitContext.parameters.date,
            }
        })

        const SesionObject = {
            session: agent.session,
            contextInput: 'user-exit',
            contextOutput: 'obtained-name-user',
            parameters: {
                name: orderBD.name,
                date: orderBD.date,
            }
        }
        servicio.guardarSesion(SesionObject);

        const tamaniosPizza = await servicio.obtenerTamanios();
        agent.add('¿Qué tamaño de pizza desea?');
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
                agent.add(`¿Es correcta tu lista de ingredientes?`);            
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
                        'idPedido': session.parameters.idPedido
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
        agent.add(`Lo siento, no contamos con ese tamaño, me puedes repetir el tamaño por favor.`);
        const tamaniosPizza = await servicio.obtenerTamanios();
        agent.add(`Éstos son los tamaños disonibles: ${tamaniosPizza}`);
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
        agent.add(`Lo siento, no entiendo muy bien, escribe de nuevo los ingredientes que deseas.`);
        const ingredientes = await servicio.ingredientes();
        agent.add(`Éstos son los disponibles : ${ingredientes}`);
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
        agent.add(`No entendí muy bien, escribe de nuevo tu dirección.`);

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
        agent.add(`No entendí muy bien, escribe de nuevo tu número telefónico.`);
    }

    function fallbackname(agent) {
        const awaitingNameContext = agent.context.get('name-user');
        agent.context.set({
            'name':'name-user',
            'lifespan': 2,
        });
        agent.add(`No entendí muy bien, escribe de nuevo tu nombre.`);
    }

    let intentMap = new Map();
    intentMap.set('welcome.client', welcome);
    intentMap.set('name.user.obtained', obtainName);
    intentMap.set('name.user.obtained.catch.all', obtainNameAll);
    intentMap.set('name.user.obtained - yes', obtainNameYes);
    intentMap.set('name.user.obtained - no', obtainNameNo);
    intentMap.set('pizza.size.obtained', sizePizza);
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