import * as THREE from 'three';

class PlayerModel extends THREE.Group{
    constructor(){
        super();
        this.OSCILLATION_SPEED = 1.0;
    }

    loadModel(){
    let geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    let material = new THREE.MeshStandardMaterial({ color: 0x000f300, wireframe: true});
    let mesh = new THREE.Mesh(geometry, material);
    this.add(mesh);
    }
}

export { PlayerModel };