import * as cm from './clientManager.js';

cm.registerToServer('WALL')
    .then(response => {})
    .catch(error => console.error('Failed:'. error));