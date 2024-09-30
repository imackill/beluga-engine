<h1>Protocols</h1>
<p>Beluga's server-side programming allows for several pre-made protocols, as well as a custom one. The default protocol is "RPC" and is fitted to work with a rpc-style server; meaning that the server authorizes all changes, and thens ending render data to all connected clients. Protocols are found in the 'src/server/protocols' folder.</p>

<h2>RPC (default):</h2>
<p>RPC Handshake goes something like this: intial server confirmation of a client connection (possibly add authentication here later)
then the client sends data on how it would like to join a scene (whether it's with existing ID or not), and only then does the server send
a scene to be rendered. After this step, any data send by the client is basically a request to change some data on the server-side rendering
of a scene.</p>

<h3>Example Connection (RPC):</h3>

Server Sends:
```json
{
    "type":"confirm_connect",
    "payload":{
        "id":"some random uuid",
        "protocol":"some protocol name"
    },
    "time":"time in ms"
}
```
<footer>Note that all non-custom handshakes start with something like this.</footer>

Client response (currently not implemented as a lib):
```json
{
    "type":"scene_request",
    "payload":{
        "scene_id":"id:string or null"
    },
    "time":"time in ms"
}
```

Server response:
```json
{
    "type":"scene_response",
    "payload":{
        "scene":"{Scene object}",
        "delay":"delay in ms",// default is 50ms
    },
    "time":"time in ms"
}
```

<h3>After this initial "setup phase":</h3>

Client:
```json
{
    "type":"update_request",
    "payload":{
        "position":"Vector3",
        "rotation":"Quaternion"
    },
    "time":"time in ms"
}
```

The server updates this info on its server-side rendering of the scene.

Server:
```json
{
    "type":"update_confirm",
    "payload":{
        "result":200,
        "scene":"{Scene object}",
        "info":"" // error information if the result is not 200
    }
}
```

<footer>This repeats every `"delay"` ms</footer>