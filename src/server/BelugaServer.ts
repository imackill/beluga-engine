import * as utils from "./server_utils";
import * as http from 'http';
import * as path from 'path';
import { WebSocketServer } from "ws";
import {ServerScene } from "../scene/Scene"
import * as protocols from "./protocols/index";
import * as fs from 'fs';

interface BelugaServer{
    MIME_TYPES: utils.Mime_Utils,
    config: any,
    _isRunning: Boolean,
    _httpServer: Boolean,
    _server: http.Server,
    _scenes: any,
    _wsServer: WebSocketServer,
    _protocol: any,
    _sockets: any,
}

class BelugaServer{

    constructor(config: any){//string that is 'RPC' or null

        this.MIME_TYPES = new utils.Mime_Utils();

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

        utils.extend(this.config, config);

        this._isRunning = false;

        this._scenes = {};

        this._sockets = {};
    }

    listen(host: string, cwd: string){
        if(this.config.PORT){
            this._httpServer = true;
            this._server = http.createServer((req, res) => {
                this.routeReq(req, res, cwd);
            });
            this._server.listen(this.config.PORT, host, () => {
                console.log(`Server is listening on ${host}:${this.config.PORT}`);
            });
        }else if(this.config.server){
            this._httpServer = false;
            this._server = this.config.server;
        }else{
            throw Error(`No Port or Server specified:\ncannot start server.`);
        }

        let server = this._server;

        this._wsServer = new WebSocketServer({ server });

        this._isRunning = true;

        this._wsServer.on('connection', (ws) => {

            switch (ws.protocol){
                case 'RPC':
                    this._protocol = new protocols.RPC(this);
                    break;
                default:
                    this._protocol = new protocols.RPC(this);
                    break;
            }

            Object.defineProperty(ws, 'id', {
                value: crypto.randomUUID(),
                writable: false
            });

            this._protocol.handle('connection', ws, Date.now());

            ws.on('message', (message: string) => {
                this._protocol.handle('message', ws, message);
            });

            ws.on("close", (ws) => {
                this._protocol.handle('close', ws, Date.now());
            }); 
        });

        process.on("uncaughtException", (error) => this.handleExceptions(error));
        process.on("uncaughtRejection", (error) => this.handleExceptions(error));
    }

    getSocketByID(id: string){
        let res = null
        this._wsServer.clients.forEach((socket: any) => {
            if(socket.id){
                if(socket.id == id){
                    res = socket.id;
                }
            }
        });
        if(!res)return console.log(`Socket ${id} not found.`);
        return res;
    }

    handleExceptions(error: Error){
        console.error(error);
    }

    createNewScene(playerMax: number=10){
        let scene = new ServerScene(crypto.randomUUID(), playerMax);
        this._scenes[scene.id] = scene;
        return scene;
    }

    returnAvailableScenes(id: string=null, playerMax: number=10): ServerScene{
        if(id && this._scenes[id]){
            return this._scenes[id];
        }else if(id){
            console.warn(`Client asked for nonexistent scene ${id}, creating new scene with id ${id}.`);
            let new_scene = new ServerScene(id, playerMax);
            this._scenes[id] = new_scene;
            return new_scene;
        }else if(id == null){
            //search for available scenes (available being players < playerMax)
            let available_scenes = Object.entries(this._scenes).filter(scene =>{
                //@ts-ignore
                scene[1].recalcPlayers();
                //@ts-ignore
                return (scene[1].players !== scene[1].playerMax)
            });
            //@ts-ignore
            if(available_scenes.length >= 1) return available_scenes[0][1]
            return this.createNewScene(playerMax);
        }
    }

    routeReq(req: http.IncomingMessage, res: http.ServerResponse, cwd: string){
        let uri = `${req.url}`;
        let filename = path.join(cwd, uri);

        if(!fs.existsSync(filename)){
            res.writeHead(404, {"Content-Type" : "text/plain"});
            res.write(`404 Not Found\nERROR: ${filename}`);
            res.end();
            return;
        }

        if(fs.statSync(filename).isDirectory()){
            filename += this.config.htmlEntry;
        }

        fs.readFile(filename, "binary", (err, file) => {
            if(err){
                res.writeHead(500, {"Content-Type":"text/plain"});
                res.write(`${err}\n`);
                res.end();
                return;
            }
    
            let mimeType = this.MIME_TYPES.mime(filename.split('.').pop());
            if(mimeType == undefined) mimeType = "application/x-binary";
 
            res.writeHead(200, { "Content-Type": mimeType });
            res.write(file, 'binary');
            res.end();
        });
    }
}

export { BelugaServer };