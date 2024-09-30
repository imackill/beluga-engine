import { ServerScene } from "../../Beluga";
import * as THREE from 'three';

interface RPC{
    scene_id: string,
    id: string,
    socket: WebSocket,
    delay: number,
    clientScene: THREE.Scene,
}

class RPC{
    constructor(id: string, io: WebSocket, scene_id: string=null, clientScene: THREE.Scene){
        this.socket = io;
        this.id = id;// id is assigned on confirm_connect request, all protocols start with that
        io.send(JSON.stringify({
            type: "scene_request",
            payload: {
                "scene_id": scene_id,
                "time": Date.now(),
            }
        }));
    }

    updateScene(scene: ServerScene){
        let client_ids = this.clientScene.children.map(elem => {
            if(elem.name != ''){
                return elem.name
            }
        }).filter(elem => typeof(elem) == 'string');

        client_ids.forEach(id => {
            let pos = scene.getChildrenByID(id)[0].position;
            let rot = scene.getChildrenByID(id)[0].rotation;
            let obj = this.clientScene.getObjectByName(id);
            if(!obj)return console.warn(`Object ${id} not found.`);
            obj.position.set(pos.x, pos.y, pos.z);
            obj.rotation.set(rot.x, rot.y, rot.z);
        });

    }

    handle(event: string, ...args){
        let requestHandler = Object.getOwnPropertyDescriptor(this, event).value;
        return requestHandler(args);
    }

    scene_response(payload: any){
        this.delay = payload.delay;
        this.updateScene(payload.scene);

        setTimeout(() => {
            this.socket.send(JSON.stringify({
                type:"update_request",
                payload:{
                    position: this.clientScene.getObjectByName(this.id).position,
                    rotation: this.clientScene.getObjectByName(this.id).rotation,
                },
                time: Date.now()
            }));
        }, this.delay);
    }

    update_confirm(payload: any){
        if(payload.result == 200){
            this.updateScene(payload.scene);
        }else{
            console.error(`Error confirming update: ${payload.result}:\n${payload.info}`);
        }
    }

    disconnect(payload: any){
        this.clientScene.remove(this.clientScene.getObjectByName(payload.id));
    }

}

export { RPC }