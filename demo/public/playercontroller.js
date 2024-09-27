import * as THREE from 'three';

class PlayerController{
    constructor(player_mesh){
        this._player = player_mesh;
        this.keydict = {};
        this.SPEED = 0.1;

        document.addEventListener("keydown", (event) => {
            this.keydict[event.key] = true;
        });
        document.addEventListener("keyup", (event) => {
            this.keydict[event.key] = false;
        });
    }

    update(delta){
        let speed_vec = new THREE.Vector3();
        if(this.keydict['w']){speed_vec.z -= this.SPEED}
        if(this.keydict['a']){speed_vec.x -= this.SPEED}
        if(this.keydict['s']){speed_vec.z += this.SPEED}
        if(this.keydict['d']){speed_vec.x += this.SPEED}

        let rotation_alongX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), document.mouse.x*-0.005);
        this._player.quaternion.copy(rotation_alongX);

        speed_vec.applyQuaternion(this._player.quaternion);
        this._player.children[0].position.lerp((new THREE.Vector3(speed_vec.x, 0.5, speed_vec.z+2)), delta+0.1);
        this._player.position.lerp(this._player.position.add(speed_vec), delta);
    }
}

export { PlayerController };