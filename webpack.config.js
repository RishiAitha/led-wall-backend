const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
        vr: './src/vr.js',
        desktop: './src/desktop.js',
        wall: './src/wall.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
};