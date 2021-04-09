//destructuring 
const { frutas, dinero } = require("./frutas");

const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

//motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//Middleware
app.use(express.static(__dirname + "/public"))

//Rutas express
app.get('/', (req, res) =>{
    res.render("index", {titulo : "mi titulo dinámico"});
});

//Rutas express
app.get('/servicios', (req, res) =>{
    res.render("servicios", {tituloDeServicios : "mi titulo dinamico de servicios"});
});

//Rutas express
app.listen(port, () => {
    console.log(`servidor a su servicio en el puerto, ${port}`);
});

//Middleware
app.use((req, res, next) =>{
    res.status('404').render("404",{
        titulo:"404",
        descripcion: "Titulo del citio web"
    })
});