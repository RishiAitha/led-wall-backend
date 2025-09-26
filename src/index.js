if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        window.location.href = supported ? '/vr' : '/desktop';
    });
} else {
    window.location.href = '/desktop';
}