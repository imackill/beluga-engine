interface Scene{
    id: string,
    children: Array<any>,
    players: number,
    playerMax: number,
    vars: Map<string, any>,
}

class Scene{
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
        });
        if(!childToRemove)return;
        this.children.splice(this.children.indexOf(childToRemove), 1);
    }

    getChildrenByID(id: string): Array<any>{
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

export {Scene}