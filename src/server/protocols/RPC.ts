import { ServerScene } from "../../scene/Scene";
import { BelugaServer } from "../BelugaServer";
import { PlayerObject } from "../player_interface";

interface RPC{
    _functions: Array<any>,
    _server: BelugaServer,
    name: string,
}

class RPC{
    constructor(server: BelugaServer){
        this._server = server;
        this.name = 'RPC';
    }

    handle(event: string, ...args){
        if(typeof(this[`on${event}`]) !== 'function')return console.error(`Event "${event}" not found in protocol.`);
        return this[`on${event}`](...args);
    }

    onconnection(ws: WebSocket, time: number){

        console.log(`Socket ${ws['id']} connected at [${new Date(time).toUTCString()}]`);

        this._server._sockets[ws['id']] = {ws:ws, scene: undefined};

        let start_handshake = {
            type: "confirm_connect",
            payload:{
                id: ws['id'],
                protocol: this.name,
                delay: this._server.config.delay
            },
            time: Date.now(),
        }

        ws.send(JSON.stringify(start_handshake));

        return start_handshake;
    }

    onmessage(ws: WebSocket, message: string){
        try{
            let data = JSON.parse(message);
            this.handle(data.type, ws, data.payload);
        }catch(error: unknown){
            console.error(error);
            return console.warn(`Data received from socket ${ws['id']} is not valid JSON and will be ignored.`);
        }
    }

    //protocol-specific handlers
    onscene_request(ws: WebSocket, data){
        let scene = this._server.returnAvailableScenes(data.scene_id, data.playerMax | 10);
        this._server._sockets[data.id].scene = scene.id;
        ws.send(JSON.stringify({
            type: "scene_response",
            payload:{
                scene: scene,
            },
            time: Date.now()
        }));
    }

    onupdate_request(ws: WebSocket, data){
        let scene = this._server.returnAvailableScenes(data.scene_id);
        let player_data = [data.position, data.rotation];
        let player_data_ssr = scene.children.find(elem => elem.id == data.player_id);
        if(player_data_ssr){
            player_data_ssr.position = player_data[0];
            player_data_ssr.rotation = player_data[1];
            scene.children[scene.children.indexOf(scene.children.find(elem => elem.id == data.player_id))] = player_data_ssr;
        }else{
            scene.children.push(new PlayerObject(data.plaeyr_id, data.position, data.rotation));
        }
        scene.recalcPlayers();
        ws.send(JSON.stringify({
            type: "update_confirm",
            payload:{
                scene: scene
            },
            time: Date.now()
        }));
    }

    onclose(ws: WebSocket, time: number){
        let sock = Object.entries(this._server._sockets).filter(elem => {
            return (elem[1]['ws'].readyState == 2) || (elem[1]['ws'].readyState == 3)
        })[0];
        if(!sock)return;
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
            if(socket.readyState == 2 || socket.readyState == 3){
                socket.terminate();
            }
        });
    }
}

export { RPC }