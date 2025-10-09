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

let score = 0;
let multiplier = 1;
let bonusActive = false;
let bonusTimeout = null;

const scoreDisplay = document.createElement('div');
scoreDisplay.textContent = `Score: ${score}`;
document.body.appendChild(scoreDisplay);

const bonusDisplay = document.createElement('div');
bonusDisplay.textContent = bonusActive ? 'Bonus Active' : 'Bonus Inactive';
document.body.appendChild(bonusDisplay);

function increaseScore() {
    score += multiplier;
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateBonusDisplay() {
    if (bonusActive) {
        bonusDisplay.textContent = 'Bonus Active';
    } else {
        bonusDisplay.textContent = 'Bonus Inactive';
    }
}

function resetBonusTimer() {
    if (bonusTimeout != null) {
        clearTimeout(bonusTimeout);
    }

    bonusTimeout = setTimeout(() => {
        bonusActive = false;
        multiplier = 1;
        updateBonusDisplay();
        bonusTimeout = null;
    }, 5000);
}

function handleVRInput(inputMessage) {
    if (inputMessage == 'left_trigger' || inputMessage == 'right_trigger') {
        bonusActive = true;
        multiplier = 3;
        updateBonusDisplay();
        resetBonusTimer();
    }
}

function handleDesktopInput(inputMessage) {
    if (inputMessage == 'increase_button') {
        increaseScore();
    }
}

cm.handleInput('VR_INPUT', handleVRInput);
cm.handleInput('DESKTOP_INPUT', handleDesktopInput);