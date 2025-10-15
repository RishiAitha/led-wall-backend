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

cm.handleEvent('CLOSE', updateStatus);
