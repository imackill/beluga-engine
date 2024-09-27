import * as THREE from 'three';
import { PlayerController } from "./playercontroller.js";
import { PlayerModel } from './playermodel.js';

//basic three.js setup (taken straight from the docs)
//https://threejs.org/docs/#manual/en/introduction/Creating-a-scene

let id, protocol, player_obj, delay, player_controller;
let scene_id = null;
const clock = new THREE.Clock();

//create three.js scene
const demo_scene = new THREE.Scene();
demo_scene.fog = new THREE.FogExp2(0xf0f0f0, 0.3);

//init three.js perspective camera
const demo_camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
demo_camera.position.set(0, 0.5, 2);

//light
const demo_light = new THREE.AmbientLight( 0x404040 ); // soft white light
demo_scene.add(demo_light);

//plane
const demo_plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 100, 100), new THREE.MeshStandardMaterial({wireframe: true, color:0x000000}));
demo_plane.rotation.set(Math.PI/2,0,0);
demo_scene.add(demo_plane);

//init the WebGL Renderer
const demo_renderer = new THREE.WebGLRenderer();
demo_renderer.setSize(window.innerWidth, window.innerHeight);
demo_renderer.setClearColor( 0xffffff, 0);

//init websocket to multiplayer server
const io = new WebSocket('ws://localhost:8000', "RPC");//just have url for the demo here with RPC protocol

//animation loop and general logic
function animationLoop(){
    if(!player_controller || !player_obj)return;
    let delta = clock.getDelta();
    player_controller.update(delta);
    demo_renderer.render(demo_scene, demo_camera);

    let rotation_alongY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), document.mouse.y*-0.005);
    demo_camera.quaternion.copy(rotation_alongY);
}

demo_renderer.setAnimationLoop(animationLoop);

//add canvas to document
document.body.appendChild(demo_renderer.domElement);

document.mouse = new THREE.Vector2(0,0);

document.addEventListener("pointerlockchange", () => {
    if(document.pointerLockElement != null){
        document.addEventListener("mousemove", (e) => {
            document.mouse.x += e.movementX;
            document.mouse.y += e.movementY;
        }, false);
    }else{
        document.removeEventListener("mousemove", (e) => {
            document.mouse.x += e.movementX;
            document.mouse.y += e.movementY;
        }, false);
    }
}, false);

document.addEventListener("mousedown", (e) => document.body.requestPointerLock());
document.addEventListener("keydown", (e) => {
    if(e.key == "esc")document.exitPointerLock();
});

const SocketHandler = {

    "scene_request": (scene_id=null) => {
        if(!id || !protocol)return;
        io.send(JSON.stringify({
            type: "scene_request",
            "payload": {
                id: id,
                scene_id: scene_id
            },
            time: Date.now()
        }));
        console.log(`Requesting scene...`);
    },

    "update_request": () => {
        if(!player_obj)return;
        if(!id || !protocol)return;
        io.send(JSON.stringify({
            type:"update_request",
            payload:{
                position: player_obj.position,
                rotation: player_obj.rotation,
                player_id: id,
                scene_id: scene_id,
            },
            time: Date.now()
        }));
    },//end of functions where client sends data

    "scene_response": (data) => {//all remaining handlers are sent by the server
        if(!id || !protocol)return;
        console.log(`Connected to scene ${data.scene.id}`);
        scene_id = data.scene.id;
        data.scene.children.forEach(player => {
            createObject(player)
        });
        renderPlayer();
        setInterval(() => {
            SocketHandler.update_request();
        }, delay);
    },

    "update_confirm": (data) => {
        if(!id || !protocol)return;
        data.scene.children.forEach(player => updateObject(player));
    },

    "confirm_connect": (data) => {
        id = data.id;
        protocol = data.protocol;
        delay = data.delay
        SocketHandler.scene_request(scene_id)
    },

    "disconnect": (data) => {
        demo_scene.remove(demo_scene.getObjectByName(data.id));
    }
}

function createObject(object_data){
    if(object_data.id == id)return;
    if(object_data.isPlayer){
        let mesh = new PlayerModel();
        mesh.name = object_data.id
        mesh.isPlayer = true;
        mesh.position.set(object_data.position.x, object_data.position.y, object_data.position.z);
        mesh.rotation.set(object_data.rotation._x, object_data.rotation._y, object_data.rotation._z);
        mesh.loadModel();
        demo_scene.add(mesh);
    }
}

function updateObject(object_data){
    if(object_data.id == id)return;
    let object = demo_scene.getObjectByName(object_data.id);
    if(object == undefined){
        return createObject(object_data);
    }
    object.position.set(object_data.position.x, object_data.position.y, object_data.position.z);
    object.rotation.set(object_data.rotation._x, object_data.rotation._y, object_data.rotation._z);
}

function renderPlayer(){
    let mesh = new PlayerModel();
    mesh.name = id;
    mesh.isPlayer = true;
    player_obj = mesh;
    player_obj.add(demo_camera);
    mesh.loadModel();
    demo_scene.add(mesh);
    player_controller = new PlayerController(player_obj);
}

io.onmessage = (event) => {
    let data = JSON.parse(event.data);
    let func = Object.getOwnPropertyDescriptor(SocketHandler, data.type).value;
    func(data.payload);
}
