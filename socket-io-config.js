if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.ZWITTERION_SOCKET = window.ZWITTERION_SOCKET || io('https://localhost:8000');
    window.ZWITTERION_SOCKET.removeAllListeners('reload');
    window.ZWITTERION_SOCKET.on('reload', function() {
        window.location.reload();
    });
}
