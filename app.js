const express = require('express');
const app = express();

const http = require('http');
const socketIo = require("socket.io");
const redis = require('redis');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});

server.listen(3003);

io.on('connection', socket => {
    const subscriber = getRedisClient();

    (async () => {
        await subscriber.connect();
    })();
    
    // here socker server is subscribing to messages recieved in redis pubsub channel named as drive
    // which will proxy pass to frontend via socket event emit

    // Frontend upon recieving these event can do:
    // 1. A basic HTTP Poll on the changes resources
    // 2. Render the complete response if complete event is sent over socket (this may have some response size and security concerns/limit)
    subscriber.subscribe('drive', (message, channel) => {
        console.log(`Received ${message} from ${channel}`);
        socket.emit("message", message);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected');
        subscriber.quit();
    });

});

const getRedisClient = () => {
    const client = redis.createClient({
        url :"redis://localhost:6379"
    });

    client.on('error', function (err) {
        console.error('Redis error: ', err);
    });

    client.on('ready', () => {
       console.log("Connected to Redis!");
    });
    return client;
}