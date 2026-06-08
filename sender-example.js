/**
 * GeoGuessr Realtime Relay - Sender Example
 * 
 * This script demonstrates how to send location updates to the relay.
 * Usage: node sender-example.js
 */

const WebSocket = require('ws');

const ROOM = 'main';
const WS_URL = `ws://localhost:8787/ws?room=${ROOM}&role=sender`;

console.log(`Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('Connected to relay');

    let round = 1;
    let lat = -6.2088;
    let lng = 106.8456;

    // Simulate movement
    setInterval(() => {
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;

        const payload = {
            type: 'location',
            room: ROOM,
            round: round,
            lat: lat,
            lng: lng,
            timestamp: Math.floor(Date.now() / 1000)
        };

        console.log('Sending location:', payload);
        ws.send(JSON.stringify(payload));

        // Occasionally change round
        if (Math.random() > 0.95) {
            round++;
            console.log('Round changed to', round);
        }
    }, 2000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('Received from server:', msg.type);
});

ws.on('error', (err) => {
    console.error('Socket error:', err.message);
});

ws.on('close', () => {
    console.log('Disconnected from relay');
});
