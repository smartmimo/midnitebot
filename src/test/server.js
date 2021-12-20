const express = require('express')
const WebSocket = require('ws');

const app = express();

const wss = new WebSocket.Server({ noServer: true });

//Handle all messages from browser, here all bot related functions are gonna be treated. Eg: Login.
wss.on('connection', (ws) => {
	// runs a callback on message event
	ws.on('message', (payload) => {
		console.log(payload)
	})
})

app.get("/", (req, res) => res.send("<script>const c = new WebSocket(`ws://${window.location.host}`); c.onopen = ()=>document.innerHTML = 'opened'</script>"))
const server = app.listen(3000);
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});

