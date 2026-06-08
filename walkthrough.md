# WebSocket Tracker Integration Walkthrough

I have integrated the WebSocket sender module into your GeoGuessr userscript. This module enables real-time location tracking by sending coordinate updates to your WebSocket relay.

## Key Features Implemented

*   **RealtimeTracker Module**: A robust module handling WebSocket lifecycle:
    *   **Auto Connect**: Automatically connects on script initialization (if URL is configured).
    *   **Exponential Backoff**: Automatically reconnects with increasing delays (1s up to 30s) upon connection loss.
    *   **Heartbeat**: Sends periodic pings every 30 seconds to keep the connection alive.
    *   **Message Queuing**: Queues messages while disconnected and automatically flushes them when the connection is restored.
    *   **Payload Validation**: Ensures only valid coordinates and data are sent.
*   **Integrated UI Panel**: 
    *   A new 📡 **Web Socket** icon in the script's mobile-style UI.
    *   A dedicated status view showing:
        *   **Connection Status** (Connected, Reconnecting, etc.)
        *   **Room ID**
        *   **Message Counts** (Sent/Queued)
        *   **Reconnect Attempts**
        *   **Last Update Timestamp**
    *   **🔗 Open Realtime Map** button to quickly visit your GitHub Pages map.
    *   Manual **Connect/Disconnect** controls.
*   **Deep Integration**: 
    *   Hooks directly into the existing [startMonitoring](file:///e:/chess/google%20sheet/develop-geoguessrjs-incrementally%20%281%29/realtime-map-app/public/userscrip/GeoGuessr.js#4126-4308) loop to send updates as soon as location changes.
    *   Automatic cleanup on page navigation or close.

## Implementation Details

### Configuration
Added `REALTIME_CONFIG` to the `CONFIG` object:
```javascript
REALTIME_CONFIG: Object.freeze({
    WS_URL: "wss://YOUR_WORKER_URL/ws?room=main&role=sender",
    ROOM: "main",
    HEARTBEAT_INTERVAL: 30000,
    RECONNECT_MIN_DELAY: 1000,
    RECONNECT_MAX_DELAY: 30000,
    QUEUE_SIZE_LIMIT: 50,
    RATE_LIMIT_MS: 500,
    DEBUG: true
})
```

### Monitoring Hook
Integrated into [startMonitoring()](file:///e:/chess/google%20sheet/develop-geoguessrjs-incrementally%20%281%29/realtime-map-app/public/userscrip/GeoGuessr.js#4126-4308):
```javascript
if (changed) {
    // ... update local UI ...
    if (typeof RealtimeTracker !== 'undefined') {
        RealtimeTracker.sendLocation(coords.lat, coords.lng, state.roundHistory[0]?.round || 1);
    }
}
```

## How to Test
1.  **Configure URL**: Change the `WS_URL` in the script's `CONFIG.REALTIME_CONFIG` to your worker's address.
2.  **Open Panel**: Press the hotkey (default `Alt+Q`) to open the "Bintang Toba Pro" panel.
3.  **Navigate to Web Socket**: Click the 📡 **Web Socket** icon in the app grid.
4.  **Monitor Status**: Check if the status changes to "Connected".
5.  **Location Sync**: As you play GeoGuessr and the script detects new locations, you will see the "Messages Sent" count increment.
6.  **Open Map**: Click **🔗 Open Realtime Map** to see your movements on the GitHub Pages site.
