let ws = null;
let connectionState = 'disconnected';
let clientType = null;

// created a general registration system with WebSocket then had AI help me add best practices like timeouts and promises
export function registerToServer(type) {
    return new Promise((resolve, reject) => {
        if (connectionState === 'connecting') {
            reject(new Error('Connection already in progress'));
            return;
        }

        clientType = type;
        
        if (ws) {
            clearSocket();
        }

        connectionState = 'connecting';
        ws = new WebSocket('ws://localhost:3000');

        const timeout = setTimeout(() => {
            connectionState = 'disconnected';
            reject(new Error('Connection timeout'));
            if (ws) {
                ws.close();
            }
        }, 10000);

        let registrationResolver = null;
        let registrationRejector = null;

        ws.onopen = () => {
            console.log('WebSocket connection opened');
            connectionState = 'connected';

            ws.send(JSON.stringify({
                type: 'REGISTER_CLIENT',
                clientType: type
            }));

            console.log('Registration request sent for:', type);

            registrationResolver = resolve;
            registrationRejector = reject;
        };

        ws.onmessage = ({ data }) => {
            try {
                const message = JSON.parse(data);
                console.log('Recieved message:', message);

                handleIncomingMessage(message, {
                    resolve: registrationResolver,
                    reject: registrationRejector,
                    timeout
                });
            } catch (error) {
                console.error('Failed to parse message:', error);
                sendError('Invalid JSON format');
            }
        };

        ws.onclose = (event) => {
            clearTimeout(timeout);
            connectionState = 'disconnected';
            console.log('WebSocket connection closed:', event.code, event.reason);

            if (registrationRejector) {
                registrationRejector(new Error('Connection closed before registration completed'));
            }

            ws = null;
        }

        ws.onerror = (error) => {
            clearTimeout(timeout);
            connectionState = 'disconnected';
            console.error('WebSocket error:', error);
            reject(error);
        };
    });
}

function handleIncomingMessage(message, { resolve, reject, timeout }) {
    if (!message.type) {
        sendError('No message type specified');
        return;
    }

    switch (message.type) {
        case 'REGISTRATION_SUCCESS':
            clearTimeout(timeout);
            connectionState = 'registered';
            console.log('Registration successful:', message.message);
            if (resolve) {
                resolve({
                    success: true,
                    message: message.message,
                    clientType: clientType
                });
            }
            break;
        case 'REGISTRATION_ERROR':
            clearTimeout(timeout);
            connectionState = 'connected';
            console.error('Registration failed:', message.message);
            if (reject) {
                reject(new Error(message.message));
            }
            break;
        case 'ERROR':
            console.error('Server sent error:', message.message);
            break;
        default:
            sendError('Data type has no matches');
            break;
    }
}

export function sendMessage(message) {
    if (!isConnected()) {
        throw new Error('Not connected to server');
    }

    ws.send(JSON.stringify(message));
}

function sendError(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: message
        }));
    }
}

function clearSocket() {
    if (ws) {
        ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
        ws = null;
    }
}

export function disconnect() {
    clearSocket();
    connectionState = 'disconnected';
    clientType = null;
    console.log('Disconnected from server');
}

export function getConnectionState() {
    return {
        state: connectionState,
        clientType: clientType,
        isConnected: isConnected()
    };
}

export function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN && connectionState === 'registered';
}

export function getWebSocket() {
    return ws;
}