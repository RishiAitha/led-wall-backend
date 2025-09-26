const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const httpPort = 8081;
const wsPort = 3000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connectedClients = new Map();
let wallConnected = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const routes = [
    { path: '/', file: 'index.html' },
    { path: '/vr', file: 'vr.html' },
    { path: '/desktop', file: 'desktop.html' },
    { path: '/wall', file: 'wall.html' },
];

routes.forEach((route) => {
    app.get(route.path, (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', route.file));
    });
});

function handleMessage(ws, data) {
    if (!data.type) {
        sendError(ws, 'No data type specified');
        return;
    }

    switch (data.type) {
        case 'REGISTER_CLIENT':
            handleClientRegistration(ws, data);
            break;
        case 'ERROR':
            console.error('Client sent error:', data.message);
            break;
        default:
            sendError(ws, 'Data type has no matches');
            break;
    }
}

function handleClientRegistration(ws, data) {
    const { clientType } = data;

    if (!clientType) {
        sendError(ws, 'Client type is required');
        return;
    }

    switch (clientType) {
        case 'WALL':
            if (wallConnected) {
                sendMessage(ws, {
                    type: 'REGISTRATION_ERROR',
                    message: 'Wall client already connected'
                });
            } else {
                wallConnected = true;
                ws.clientType = 'WALL';
                connectedClients.set(ws, { type: 'WALL', connectedAt: new Date() });
                sendMessage(ws, {
                    type: 'REGISTRATION_SUCCESS',
                    message: 'Successfully registered as WALL client'
                });
                console.log('WALL client registered');
            }
            break;
        case 'VR':
        case 'DESKTOP':
            ws.clientType = clientType;
            connectedClients.set(ws, {
                type: clientType,
                connectedAt: new Date()
            });
            sendMessage(ws, {
                type: 'REGISTRATION_SUCCESS',
                message: `Successfully registered as ${clientType} client`
            });
            console.log(`${clientType} client registered`);
            break;
        default:
            sendError(ws, `Unknown client type: ${clientType}`);
            break;
    }
}

function handleDisconnection(ws) {
    const clientInfo = connectedClients.get(ws);
    if (clientInfo) {
        console.log(`${clientInfo.type} client disconnected`);
        connectedClients.delete(ws);

        if (clientInfo.type === 'WALL') {
            wallConnected = false;
            console.log('Wall connected reset');
        }
    }
}

function sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

function sendError(ws, message) {
    sendMessage(ws, {
        type: 'ERROR',
        message: message
    });
}

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', (rawData) => {
        try {
            const data = JSON.parse(rawData);
            console.log('Received data:', data);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            sendError(ws, 'Invalid JSON format');
        }
    });

    ws.on('close', () => {
        handleDisconnection(ws);
    });
});

app.listen(httpPort, () => {
    console.log(`HTTP server listening at http://localhost:${httpPort}`);
});

server.listen(wsPort, () => {
    console.log(`WebSocket server listening on port ${wsPort}`);
});

process.on('SIGINT', () => {
    console.log('\nShutting down servers');
    wss.clients.forEach(ws => {
        ws.close();
    });
    process.exit(0);
});