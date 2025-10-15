import * as THREE from 'three';
import { init } from './init.js';
import * as cm from './clientManager.js';
import { XR_BUTTONS, XR_AXES } from 'gamepad-wrapper';
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
    statusDisplay.position.set(0, 1.5, -1.5);
}

async function onFrame(delta, time, {scene, camera, renderer, player, controllers}) {
    const controllerConfigs = [controllers.right, controllers.left];
    for (let i = 0; i < 2; i++) {
        const controller = controllerConfigs[i];
        if (controller) {
            const {gamepad, raySpace, gripSpace, mesh} = controller;
            cm.sendMessage({
                type: 'VR_CONTROLLER_STATE',
                message: {
                    controllerType: i == 0 ? 'right' : 'left',
                    triggerButtonState: gamepad.getButton(XR_BUTTONS.TRIGGER),
                    squeezeButtonState: gamepad.getButton(XR_BUTTONS.SQUEEZE),
                    touchpadButtonState: gamepad.getButton(XR_BUTTONS.TOUCHPAD),
                    thumbstickButtonState: gamepad.getButton(XR_BUTTONS.THUMBSTICK),
                    button1State: gamepad.getButton(XR_BUTTONS.BUTTON_1),
                    button2State: gamepad.getButton(XR_BUTTONS.BUTTON_2),
                    touchpadXAxisState: gamepad.getAxis(XR_AXES.TOUCHPAD_X),
                    touchpadYAxisState: gamepad.getAxis(XR_AXES.TOUCHPAD_Y),
                    thumbstickXAxisState: gamepad.getAxis(XR_AXES.THUMBSTICK_X),
                    thumbstickYAxisState: gamepad.getAxis(XR_AXES.THUMBSTICK_Y)
                }
            });
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

cm.handleEvent('CLOSE', updateStatus);

init(setupScene, onFrame);