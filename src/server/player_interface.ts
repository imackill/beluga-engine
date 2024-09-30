interface PlayerObject{
    position: {
        x: number,
        y: number,
        z: number
    },
    rotation: {
        x: number,
        y: number,
        z: number
    },
    id: string,
    isPlayer: boolean
}

class PlayerObject{
    constructor(id, position, rotation){
        this.id = id;
        this.position = position;
        this.rotation = rotation;
        this.isPlayer = true;
    }
}

export { PlayerObject };