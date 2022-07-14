const express = require("express");
const axios = require("axios");
const responseTime = require("response-time");
const redis = require("redis");
const { promisify } = require("util");

// Conexion a redis
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    legacyMode: true
});

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);


client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));


const app = express();

app.use(responseTime()); // middleware de tiempo

app.get('/character', async (req, res ) => {
    
    try {
        // response from cache
        const reply = await GET_ASYNC('characters');
        if(reply) {
            return res.json(JSON.parse(reply));
        }
         
        const response = await axios.get("http://rickandmortyapi.com/api/character");
        await SET_ASYNC('characters', JSON.stringify(response.data));        
    } catch (error) {
        console.log(error);
    }
});


app.get('/character/:id', async (req, res) => {
    try {
        const reply = await GET_ASYNC(req.params.id);
        if( reply ) {
            return res.json(JSON.parse(reply));
        }
    
        const response = await axios.get(`http://rickandmortyapi.com/api/character/${req.params.id}`);
        SET_ASYNC(req.params.id, JSON.stringify(response.data));
        return res.json(response.data);
        
    } catch (error) {
        return res.json(error.response.status).json({message: error.message});
    }
});

app.listen(3001);
console.log(`Server on port 3001`);
