import * as cm from './clientManager.js';

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) window.location.href = '/vr';
    });
}

const statusDisplay = document.createElement('div');
statusDisplay.id = 'connection-status';
document.body.appendChild(statusDisplay);

function updateStatus() {
    const state = cm.getConnectionState();
    statusDisplay.textContent = `Connection Status: ${state.state}`;
}

cm.registerToServer('DESKTOP')
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

const scoreButton = document.createElement('button');
scoreButton.textContent = 'Add to Score!';
scoreButton.onclick = () => {
    cm.sendMessage({
        type: 'DESKTOP_INPUT',
        message: 'increase_button'
    });
}
document.body.appendChild(scoreButton);