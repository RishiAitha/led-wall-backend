import * as cm from './clientManager.js';

const statusDisplay = document.createElement('div');
statusDisplay.id = 'connection-status';
document.body.appendChild(statusDisplay);

function updateStatus() {
    const state = cm.getConnectionState();
    statusDisplay.textContent = `Connection Status: ${state.state}`;
}

cm.registerToServer('WALL')
    .then(response => {
        updateStatus();
    })
    .catch(error => {
        console.error('Failed:', error);
        updateStatus();
    });

const ws = cm.getWebSocket();
if (ws) {
    ws.addEventListener('close', () => {
        updateStatus();
    });
}

function handleVRState(message) {
    const { controllerType, buttonType, buttonState, userID } = message;
    const stateDisplay = document.getElementById(`${controllerType}-${buttonType}-display-${userID}`);
    stateDisplay.textContent = `${controllerType} ${buttonType}: ${buttonState}`;
}

function handleNewClient(message) {
    const { type, userID } = message;
    const clientInfoDisplay = document.createElement('div');
    clientInfoDisplay.id = `client-display-${userID}`;
    clientInfoDisplay.textContent = `\n\nClient Type: ${type}\nClient ID: ${userID}`;
    clientInfoDisplay.style.whiteSpace = 'pre-line';

    const leftControllerDisplay = document.createElement('div');
    leftControllerDisplay.id = `left-controller-display-${userID}`;
    leftControllerDisplay.style.whiteSpace = 'pre-line';
    const leftTriggerDisplay = document.createElement('div');
    leftTriggerDisplay.id = `left-trigger-display-${userID}`;
    leftTriggerDisplay.style.whiteSpace = 'pre-line';

    const rightControllerDisplay = document.createElement('div');
    rightControllerDisplay.id = `right-controller-display-${userID}`;
    rightControllerDisplay.style.whiteSpace = 'pre-line';
    const rightTriggerDisplay = document.createElement('div');
    rightTriggerDisplay.id = `right-trigger-display-${userID}`;
    rightTriggerDisplay.style.whiteSpace = 'pre-line';

    leftControllerDisplay.appendChild(leftTriggerDisplay);
    rightControllerDisplay.appendChild(rightTriggerDisplay);
    clientInfoDisplay.appendChild(leftControllerDisplay);
    clientInfoDisplay.appendChild(rightControllerDisplay);
    document.body.appendChild(clientInfoDisplay);
}

function handleClientDisconnect(message) {
    const { type, userID } = message;
    const clientInfoDisplay = document.getElementById(`client-display-${userID}`);
    clientInfoDisplay.remove();
}

cm.handleData('NEW_CLIENT', handleNewClient);
cm.handleData('CLIENT_DISCONNECTED', handleClientDisconnect);
cm.handleData('VR_CONTROLLER_STATE', handleVRState);