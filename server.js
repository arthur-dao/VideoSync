const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const OpenAIApi = require('openai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAIApi(OPENAI_API_KEY);

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

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('synchronize', (data) => {
        io.emit('sync', data);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.post('/api/chat', async (req, res) => {
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
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
