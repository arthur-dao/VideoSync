const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
//const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
//const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

//const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));

app.use(express.static('client/build'));
app.use(express.json());

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('synchronize', (data) => {
        console.log('Synchronize event received:', data);
        socket.broadcast.emit('sync', data);
    });

    socket.on('play', (data) => {
        console.log('Play event received:', data);
        socket.broadcast.emit('play', data);
    });

    socket.on('pause', (data) => {
        console.log('Pause event received:', data);
        socket.broadcast.emit('pause', data);
    });

    socket.on('seek', (data) => {
        console.log('Seek event received:', data);
        socket.broadcast.emit('seek', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

/*app.post('/api/chat', async (req, res) => {
    const question = req.body.question;
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: question,
            max_tokens: 150
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});*/

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
