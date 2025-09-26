import * as THREE from 'three';
import { init } from './init.js';
import * as cm from './clientManager.js';
import { XR_BUTTONS } from 'gamepad-wrapper';

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (!supported) window.location.href = '/desktop';
    });
} else {
    window.location.href = '/desktop';
}

function setupScene({ scene, camera, renderer, player, controllers }) {
    const floorGeometry = new THREE.PlaneGeometry(6, 6);
    const floorMaterial = new THREE.MeshStandardMaterial({color: 'white'});
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotateX(-Math.PI / 2);
    scene.add(floor);
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

cm.registerToServer('VR')
    .then(response => {})
    .catch(error => console.error('Failed:'. error));