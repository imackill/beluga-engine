import * as http from 'http';
import * as path from 'path';
import { WebSocketServer } from 'ws';
import * as fs from 'fs';

//class used for dynamic mime types on a server, allowing for custom import handling
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Mime_Utils_changes;
class Mime_Utils {
    constructor() {
        _Mime_Utils_changes.set(this, {});
        this.default = "application/octet-stream";
        this.html = "text/html; charset=UTF-8";
        this.js = "application/javascript";
        this.css = "text/css";
        this.png = "image/png";
        this.jpg = "image/jpg";
        this.gif = "image/gif";
        this.ico = "image/x-icon";
        this.ssvg = "image/svg+xml";
    }
    editMime(mimeName, mimeValue) {
        if (Object.keys(this).includes(mimeName)) {
            try {
                __classPrivateFieldGet(this, _Mime_Utils_changes, "f")[Object.entries(__classPrivateFieldGet(this, _Mime_Utils_changes, "f")).length] = {
                    target: mimeName,
                    oldMime: Object.getOwnPropertyDescriptor(this, mimeName),
                    newMime: mimeValue,
                };
                Object.defineProperty(this, mimeName, mimeValue);
            }
            catch (mimeError) {
                console.error(mimeError);
            }
        }
    }
    revertChange(index) {
        if ((index > Object.entries(__classPrivateFieldGet(this, _Mime_Utils_changes, "f")).length + 1) && (index != -1)) {
            return console.error(`Could not revert MimeUtil change:\n\tindex ${index} not in changelog.`);
        }
    }
    mime(key) {
        return this[key];
    }
}
_Mime_Utils_changes = new WeakMap();
//shamelessly stole this idea, but it's super useful
function extend(dest, src) {
    for (let prop in src) {
        dest[prop] = src[prop];
    }
}

class Scene {
    constructor(id, playerMax) {
        this.children = [];
        this.id = id;
        this.players = 0;
        this.playerMax = playerMax;
        this.vars = new Map();
    }
    remove(id) {
        let childToRemove = this.children.filter(elem => {
            elem.id == id;
        });
        if (!childToRemove)
            return;
        this.children.splice(this.children.indexOf(childToRemove), 1);
    }
    getChildrenByID(id) {
        return this.children.filter(elem => {
            elem.id == id;
        });
    }
    recalcPlayers() {
        this.players = 0;
        this.children.forEach(obj => {
            if (obj.isPlayer) {
                this.players += 1;
            }
        });
        return;
    }
}

class RPC {
    constructor(server) {
        this._server = server;
        this.name = 'RPC';
    }
    handle(event, ...args) {
        if (typeof (this[`on${event}`]) !== 'function')
            return console.error(`Event "${event}" not found in protocol.`);
        return this[`on${event}`](...args);
    }
    onconnection(ws, time) {
        console.log(`Socket ${ws['id']} connected at [${new Date(time).toUTCString()}]`);
        this._server._sockets[ws['id']] = { ws: ws, scene: undefined };
        let start_handshake = {
            type: "confirm_connect",
            payload: {
                id: ws['id'],
                protocol: this.name,
                delay: this._server.config.delay
            },
            time: Date.now(),
        };
        ws.send(JSON.stringify(start_handshake));
        return start_handshake;
    }
    onmessage(ws, message) {
        try {
            let data = JSON.parse(message);
            this.handle(data.type, ws, data.payload);
        }
        catch (error) {
            console.error(error);
            return console.warn(`Data received from socket ${ws['id']} is not valid JSON and will be ignored.`);
        }
    }
    //protocol-specific handlers
    onscene_request(ws, data) {
        let scene = this._server.returnAvailableScenes(data.scene_id, data.playerMax | 10);
        this._server._sockets[data.id].scene = scene.id;
        ws.send(JSON.stringify({
            type: "scene_response",
            payload: {
                scene: scene,
            },
            time: Date.now()
        }));
    }
    onupdate_request(ws, data) {
        let scene = this._server.returnAvailableScenes(data.scene_id);
        let player_data = [data.position, data.rotation];
        let player_data_ssr = scene.children.find(elem => elem.id == data.player_id);
        if (player_data_ssr) {
            player_data_ssr.position = player_data[0];
            player_data_ssr.rotation = player_data[1];
            scene.children[scene.children.indexOf(scene.children.find(elem => elem.id == data.player_id))] = player_data_ssr;
        }
        else {
            scene.children.push({
                id: data.player_id,
                position: data.position,
                rotation: data.rotation,
                isPlayer: true,
            });
        }
        scene.recalcPlayers();
        ws.send(JSON.stringify({
            type: "update_confirm",
            payload: {
                scene: scene
            },
            time: Date.now()
        }));
    }
    onclose(ws, time) {
        let sock = Object.entries(this._server._sockets).filter(elem => {
            return (elem[1]['ws'].readyState == 2) || (elem[1]['ws'].readyState == 3);
        })[0];
        if (!sock)
            return;
        Object.values(this._server._scenes).forEach(scene => {
            //@ts-ignore
            scene.remove(sock[0]);
            this._server._wsServer.clients.forEach(client => {
                client.send(JSON.stringify({
                    type: "disconnect",
                    payload: {
                        id: sock[0]
                    },
                    time: Date.now()
                }));
            });
        });
        console.log(`Socket ${sock[0]} closed at [${new Date(time).toUTCString()}]`);
        delete this._server._sockets[sock[0]];
        this._server._wsServer.clients.forEach(socket => {
            if (socket.readyState == 2 || socket.readyState == 3) {
                socket.terminate();
            }
        });
    }
}

class BelugaServer {
    constructor(config) {
        this.MIME_TYPES = new Mime_Utils();
        //config files can be changed by inputting
        //when calling the server e.g. new BelugaServer({ config stuff })
        this.config = {
            //if an existing server is to be used, by default creates a new http server
            server: false,
            //port, default is 8080
            //IT IS STRONGLY RECOMMENDED THAT YOU CHANGE IT FOR ACTUAL USE
            PORT: 8080,
            //path for static files
            STATIC: path.join(process.cwd(), "./public"),
            //entry point for html, default is index.html
            //called when a user visits the site ending with "/"
            htmlEntry: "index.html",
            delay: 50,
        };
        extend(this.config, config);
        this._isRunning = false;
        this._scenes = {};
        this._sockets = {};
    }
    listen(host, cwd) {
        if (this.config.PORT) {
            this._httpServer = true;
            this._server = http.createServer((req, res) => {
                this.routeReq(req, res, cwd);
            });
            this._server.listen(this.config.PORT, host, () => {
                console.log(`Server is listening on ${host}:${this.config.PORT}`);
            });
        }
        else if (this.config.server) {
            this._httpServer = false;
            this._server = this.config.server;
        }
        else {
            throw Error(`No Port or Server specified:\ncannot start server.`);
        }
        let server = this._server;
        this._wsServer = new WebSocketServer({ server });
        this._isRunning = true;
        this._wsServer.on('connection', (ws) => {
            switch (ws.protocol) {
                case 'RPC':
                    this._protocol = new RPC(this);
                    break;
                default:
                    this._protocol = new RPC(this);
                    break;
            }
            Object.defineProperty(ws, 'id', {
                value: crypto.randomUUID(),
                writable: false
            });
            this._protocol.handle('connection', ws, Date.now());
            ws.on('message', (message) => {
                this._protocol.handle('message', ws, message);
            });
            ws.on("close", (ws) => {
                this._protocol.handle('close', ws, Date.now());
            });
        });
        process.on("uncaughtException", (error) => this.handleExceptions(error));
        process.on("uncaughtRejection", (error) => this.handleExceptions(error));
    }
    getSocketByID(id) {
        let res = null;
        this._wsServer.clients.forEach((socket) => {
            if (socket.id) {
                if (socket.id == id) {
                    res = socket.id;
                }
            }
        });
        if (!res)
            return console.log(`Socket ${id} not found.`);
        return res;
    }
    handleExceptions(error) {
        console.error(error);
    }
    createNewScene(playerMax = 10) {
        let scene = new Scene(crypto.randomUUID(), playerMax);
        this._scenes[scene.id] = scene;
        return scene;
    }
    returnAvailableScenes(id = null, playerMax = 10) {
        if (id && this._scenes[id]) {
            return this._scenes[id];
        }
        else if (id) {
            console.warn(`Client asked for nonexistent scene ${id}, creating new scene with id ${id}.`);
            let new_scene = new Scene(id, playerMax);
            this._scenes[id] = new_scene;
            return new_scene;
        }
        else if (id == null) {
            //search for available scenes (available being players < playerMax)
            let available_scenes = Object.entries(this._scenes).filter(scene => {
                //@ts-ignore
                scene[1].recalcPlayers();
                //@ts-ignore
                return (scene[1].players !== scene[1].playerMax);
            });
            //@ts-ignore
            if (available_scenes.length >= 1)
                return available_scenes[0][1];
            return this.createNewScene(playerMax);
        }
    }
    routeReq(req, res, cwd) {
        let uri = `${req.url}`;
        let filename = path.join(cwd, uri);
        if (!fs.existsSync(filename)) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.write(`404 Not Found\nERROR: ${filename}`);
            res.end();
            return;
        }
        if (fs.statSync(filename).isDirectory()) {
            filename += this.config.htmlEntry;
        }
        fs.readFile(filename, "binary", (err, file) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.write(`${err}\n`);
                res.end();
                return;
            }
            let mimeType = this.MIME_TYPES.mime(filename.split('.').pop());
            if (mimeType == undefined)
                mimeType = "application/x-binary";
            res.writeHead(200, { "Content-Type": mimeType });
            res.write(file, 'binary');
            res.end();
        });
    }
}

export { BelugaServer };
//# sourceMappingURL=beluga-engine.js.map
