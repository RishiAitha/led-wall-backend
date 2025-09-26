import * as cm from './clientManager.js';

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) window.location.href = '/vr';
    });
}

cm.registerToServer('DESKTOP')
    .then(response => {})
    .catch(error => console.error('Failed:'. error));