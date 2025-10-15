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

const controllerStates = new Map();

function handleVRState(message) {
    // const stateDisplay = document.getElementById(`${message.controllerType}-controller-display-${message.userID}`);
    // stateDisplay.textContent = JSON.stringify(message, null, 2);

    // save controller states
    const drawingCanvas = document.getElementById(`client-canvas-${message.userID}`);
    const ctx = drawingCanvas.getContext('2d');

    if (!controllerStates.has(message.userID)) {
        controllerStates.set(message.userID, {})
    }
    controllerStates.get(message.userID)[message.controllerType] = message;
    
    // draw to canvas
    if (message.triggerButtonState == true) {
        ctx.fillStyle = message.controllerType == 'left' ? 'blue' : 'red';

        const canvasX = ((message.position.x / 0.5) * (drawingCanvas.width / 2)) + (drawingCanvas.width / 2);
        const canvasY = ((-(message.position.y - 1.5) / 0.25) * (drawingCanvas.height / 2)) + (drawingCanvas.height / 2);

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // const userStates = controllerStates.get(message.userID);

    // Object.entries(userStates).forEach(([controllerType, state]) => {
    //     if (message.controllerType == controllerType && state.triggerButtonState == true) {
    //         ctx.fillStyle = controllerType == 'left' ? 'blue' : 'red';

    //         const canvasX = ((state.position.x / 0.5) * (drawingCanvas.width / 2)) + (drawingCanvas.width / 2);
    //         const canvasY = ((-(state.position.y - 1.5) / 0.25) * (drawingCanvas.height / 2)) + (drawingCanvas.height / 2);

    //         ctx.beginPath();
    //         ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
    //         ctx.fill();
    //     }
    // });
}

function handleNewClient(message) {
    // const { type, userID } = message;
    // const clientInfoDisplay = document.createElement('div');
    // clientInfoDisplay.id = `client-display-${userID}`;
    // clientInfoDisplay.textContent = `\n\nClient Type: ${type}\nClient ID: ${userID}`;
    // clientInfoDisplay.style.whiteSpace = 'pre-line';

    // if (type === 'VR') {
    //     const leftControllerStateDisplay = document.createElement('div');
    //     leftControllerStateDisplay.id = `left-controller-display-${userID}`;
    //     leftControllerStateDisplay.style.whiteSpace = 'pre-line';

    //     const rightControllerStateDisplay = document.createElement('div');
    //     rightControllerStateDisplay.id = `right-controller-display-${userID}`;
    //     rightControllerStateDisplay.style.whiteSpace = 'pre-line';

    //     clientInfoDisplay.appendChild(leftControllerStateDisplay);
    //     clientInfoDisplay.appendChild(rightControllerStateDisplay);
    // }
    
    // document.body.appendChild(clientInfoDisplay);

    const {type, userID } = message;

    if (type === 'VR') {
        const clientInfoDisplay = document.createElement('div');
        clientInfoDisplay.id = `client-display-${userID}`;
        clientInfoDisplay.textContent = `\n\nClient Type: ${type}\nClient ID: ${userID}`;
        clientInfoDisplay.style.whiteSpace = 'pre-line';

        const drawingCanvas = document.createElement('canvas');
        drawingCanvas.id = `client-canvas-${userID}`;
        drawingCanvas.width = 960;
        drawingCanvas.height = 540;
        drawingCanvas.style.border = '1px solid black';

        const canvasBreak = document.createElement('br');
        canvasBreak.id = `client-canvasBreak-${userID}`;

        const clearButton = document.createElement('button');
        clearButton.id = `client-clearButton-${userID}`;
        clearButton.textContent = 'Clear Canvas';
        clearButton.onclick = () => {
            const ctx = drawingCanvas.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        }

        document.body.appendChild(clientInfoDisplay);
        document.body.appendChild(drawingCanvas);
        document.body.appendChild(canvasBreak);
        document.body.appendChild(clearButton);
    }
}

function handleClientDisconnect(message) {
    const { type, userID } = message;
    const clientInfoDisplay = document.getElementById(`client-display-${userID}`);
    clientInfoDisplay.remove();
    const drawingCanvas = document.getElementById(`client-canvas-${userID}`);
    drawingCanvas.remove();
    const canvasBreak = document.getElementById(`client-canvasBreak-${userID}`);
    canvasBreak.remove();
    const clearButton = document.getElementById(`client-clearButton-${userID}`);
    clearButton.remove();
}

cm.handleEvent('NEW_CLIENT', handleNewClient);
cm.handleEvent('CLIENT_DISCONNECTED', handleClientDisconnect);
cm.handleEvent('VR_CONTROLLER_STATE', handleVRState);