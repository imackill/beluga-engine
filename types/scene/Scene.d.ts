interface Scene {
    id: string;
    children: Array<any>;
    players: number;
    playerMax: number;
}
declare class Scene {
    constructor(id: string, playerMax: number);
    getChildrenByID(id: string): Array<any>;
    recalcPlayers(): void;
}
export { Scene };
