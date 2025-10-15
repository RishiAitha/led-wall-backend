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

cm.handleEvent('CLOSE', updateStatus);

function handleVRState(message) {
    const stateDisplay = document.getElementById(`${message.controllerType}-controller-display-${message.userID}`);
    stateDisplay.textContent = JSON.stringify(message, null, 2);
}

function handleNewClient(message) {
    const { type, userID } = message;
    const clientInfoDisplay = document.createElement('div');
    clientInfoDisplay.id = `client-display-${userID}`;
    clientInfoDisplay.textContent = `\n\nClient Type: ${type}\nClient ID: ${userID}`;
    clientInfoDisplay.style.whiteSpace = 'pre-line';

    if (type === 'VR') {
        const leftControllerStateDisplay = document.createElement('div');
        leftControllerStateDisplay.id = `left-controller-display-${userID}`;
        leftControllerStateDisplay.style.whiteSpace = 'pre-line';

        const rightControllerStateDisplay = document.createElement('div');
        rightControllerStateDisplay.id = `right-controller-display-${userID}`;
        rightControllerStateDisplay.style.whiteSpace = 'pre-line';

        clientInfoDisplay.appendChild(leftControllerStateDisplay);
        clientInfoDisplay.appendChild(rightControllerStateDisplay);
    }
    
    document.body.appendChild(clientInfoDisplay);
}

function handleClientDisconnect(message) {
    const { type, userID } = message;
    const clientInfoDisplay = document.getElementById(`client-display-${userID}`);
    clientInfoDisplay.remove();
}

cm.handleEvent('NEW_CLIENT', handleNewClient);
cm.handleEvent('CLIENT_DISCONNECTED', handleClientDisconnect);
cm.handleEvent('VR_CONTROLLER_STATE', handleVRState);