import { PlayerObject } from "../server/player_interface"

interface ServerScene{
    id: string,
    children: Array<PlayerObject>,
    players: number,
    playerMax: number,
    vars: Map<string, any>,
}

class ServerScene{
    constructor(id: string, playerMax: number){
        this.children = [];
        this.id = id;
        this.players = 0;
        this.playerMax = playerMax;
        this.vars = new Map()
    }

    remove(id: string): void {
        let childToRemove = this.children.filter(elem => {
            elem.id == id;
        })[0];
        if(!childToRemove)return;
        this.children.splice(this.children.indexOf(childToRemove), 1);
    }

    getChildrenByID(id: string): Array<PlayerObject>{
        return this.children.filter(elem => {
            elem.id == id;
        });
    }

    recalcPlayers(){
        this.players = 0;
        this.children.forEach(obj => {
            if(obj.isPlayer){
                this.players += 1
            }
        });
        return;
    }
}

export {ServerScene}