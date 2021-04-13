//destructuring 
//const { frutas, dinero } = require("./frutas");

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const {WebhookClient} = require('dialogflow-fulfillment');

//Revisa ésta nueva forma
/*app.use(express.urlencoded({ extended: true }));
app.use(express.json());*/

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());

require('dotenv').config();

const port = process.env.PORT || 3000;

//Conexión a base de datos
const mongoose = require('mongoose');

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.iqym7.mongodb.net/${process.env.BDNAME}?retryWrites=true&w=majority`;

mongoose.connect(uri, 
    {useNewUrlParser: true, useUnifiedTopology: true}
).then(() => console.log('Base de datos conectada')

).catch(e => console.log(e))

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

//Endpoint exposed to DialogFlow
app.post('/webwook', express.json(), (req, res) => {

    //Agent is initialized
    const agent = new WebhookClient({ request:req, response:res });

    //Logs to know whats is happen
    console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(req.body));


    const pizzaSizes = ['individual', 'mediana', 'familiar'];
    
    function welcome(agent) {

        agent.add(`¡Hola, bienvenido a pizzería Demo!`);
        agent.add('¿De qué tamaño quiere que sea su pizza?');
        //agent.add('Las opciones son individual, mediana y familiar desde webhook normal.');
                      
    }
        
    function fallback(agent) {
        agent.add('Ups, no he entendido a que te refieres.');
        agent.add('¿Podrías repetirlo, por favor?');
        agent.add('Lo siento, no entedí lo que trataste de decirme.');
    }
    
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);

    agent.handleRequest(intentMap);

})