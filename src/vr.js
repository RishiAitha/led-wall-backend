import * as THREE from 'three';
import { init } from './init.js';
import * as cm from './clientManager.js';
import { XR_BUTTONS } from 'gamepad-wrapper';
import { Text } from 'troika-three-text';

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (!supported) window.location.href = '/desktop';
    });
} else {
    window.location.href = '/desktop';
}

let floor;
let statusDisplay;
function setupScene({ scene, camera, renderer, player, controllers }) {
    const floorGeometry = new THREE.PlaneGeometry(6, 6);
    const floorMaterial = new THREE.MeshStandardMaterial({color: 'white'});
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotateX(-Math.PI / 2);
    scene.add(floor);

    statusDisplay = new Text();
    statusDisplay.anchorX = 'center';
    statusDisplay.anchorY = 'middle';
    statusDisplay.fontSize = 0.25;
    scene.add(statusDisplay);
    statusDisplay.position.set(0, 0.67, -1.5);
}

async function onFrame(delta, time, {scene, camera, renderer, player, controllers}) {
    const controllerConfigs = [controllers.right, controllers.left];
    for (let i = 0; i < 2; i++) {
        const controller = controllerConfigs[i];
        if (controller) {
            const {gamepad, raySpace, mesh} = controller;
            // do stuff with controller input here
        }
    }
}

function updateStatus() {
    const state = cm.getConnectionState();
    statusDisplay.text = `Connection Status: ${state.state}`;
    statusDisplay.sync();
}

cm.registerToServer('VR')
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

init(setupScene, onFrame);