// express and websocket server setup
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// info on clients
const connectedClients = new Map();
let wallRegistered = false;

app.use(express.json()); // start up app
app.use(express.static(path.join(__dirname, 'dist'))); // serve JS bundles
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

// http routes
const routes = [
    { path: '/', file: 'index.html' },
    { path: '/vr', file: 'vr.html' },
    { path: '/desktop', file: 'desktop.html' },
    { path: '/wall', file: 'wall.html' },
];

// set up files for each route
routes.forEach((route) => {
    app.get(route.path, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', route.file));
    });
});

// handle message coming to server
function handleMessage(ws, data) {
    if (!data.type) {
        sendError(ws, 'No data type specified');
        return;
    }

    switch (data.type) {
        case 'REGISTER_CLIENT': // client wants to register to the server
            handleClientRegistration(ws, data);
            break;
        case 'ERROR': // client told server there was an error
            console.error('Client sent error:', data.message);
            break;
        case 'VR_INPUT': // handle vr client input
        case 'DESKTOP_INPUT': // handle desktop client input
            let wallClient = getWallClient();
            if (wallClient) {
                sendMessage(wallClient, {
                    type: data.type,
                    message: data.message
                });
            }
            break;
        default:
            sendError(ws, 'Data type has no matches');
            break;
    }
}

// handle a new client being registered
function handleClientRegistration(ws, data) {
    const { clientType } = data; // take the client type from the given data

    if (!clientType) {
        sendError(ws, 'Client type is required');
        return;
    }

    switch (clientType) {
        case 'WALL': // wall type connected
            if (wallRegistered) { // we already have a wall, send a registration error
                // this needs to be handled as a separate message because
                // errors during registration impact connection state
                sendMessage(ws, {
                    type: 'REGISTRATION_ERROR',
                    message: 'Wall client already registered'
                });
            } else {
                wallRegistered = true; // mark that a wall has been connected
                // store wall client with websocket and tell client it is successful
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
            // store vr or desktop client with websocket and tell client it is successful
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

function handleDisconnection(ws) { // runs when a client websocket closes
    const clientInfo = connectedClients.get(ws);
    if (clientInfo) {
        // removes client from client storage
        console.log(`${clientInfo.type} client disconnected`);
        connectedClients.delete(ws);

        if (clientInfo.type === 'WALL') { // updates relevant info on connected wall
            wallRegistered = false;
            console.log('Wall registered reset');
        }
    }
}

function sendMessage(ws, message) { // sends message to client
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

function sendError(ws, message) { // sends message of type 'ERROR' to client
    // use this for general, simple errors, specific stuff like registration errors
    // can instead have their own error types when appropriate
    sendMessage(ws, {
        type: 'ERROR',
        message: message
    });
}

function getWallClient() {
    if (!wallRegistered) return null;
    for (const [ws, clientInfo] of connectedClients) {
        if (clientInfo.type === 'WALL') {
            return ws;
        }
    }
    return null;
}

wss.on('connection', (ws) => { // runs when a client connects to the server
    console.log('New WebSocket connection established');

    ws.on('message', (rawData) => { // runs when a client sends a message to the server
        try {
            const data = JSON.parse(rawData);
            console.log('Received data:', data);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            sendError(ws, 'Invalid JSON format');
        }
    });

    ws.on('close', () => { // runs when a client websocket disconnects from the server
        handleDisconnection(ws);
    });
});

// handle server shutdowns for websockets and clients
function handleShutdown(signal) {
    console.log(`\nReceived ${signal}, shutting down servers`);
    for (const [ws] of connectedClients) {
        ws.close();
    }

    connectedClients.clear();
    wallRegistered = false;

    wss.close(() => {
        console.log('WebSocket server closed');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
}

server.listen(port, () => { // turns on websocket server on port
    console.log(`HTTP/WebSocket servers listening on port ${port}`);
});

// handle all shutdown processes
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGQUIT', () => handleShutdown('SIGQUIT'));

process.on('uncaughtException', (error) => { // shutdown on uncaught exception
    console.error('Uncaught Exception:', error);
    handleShutdown('uncaughtException');
});

process.on('unhandledRejection', (error) => { // shutdown on unhandled rejection
    console.error('Unhandled Rejection:', error);
    handleShutdown('unhandledRejection');
});