import * as http from 'http';
import { WebSocketServer } from 'ws';

interface Mime_Utils {
    default: string;
    html: string;
    js: string;
    css: string;
    png: string;
    jpg: string;
    gif: string;
    ico: string;
    ssvg: string;
}
declare class Mime_Utils {
    #private;
    constructor();
    editMime(mimeName: string, mimeValue: string): void;
    revertChange(index: number): void;
    mime(key: string): any;
}

interface Scene {
    id: string;
    children: Array<any>;
    players: number;
    playerMax: number;
    vars: Map<string, any>;
}
declare class Scene {
    constructor(id: string, playerMax: number);
    remove(id: string): void;
    getChildrenByID(id: string): Array<any>;
    recalcPlayers(): void;
}

interface BelugaServer {
    MIME_TYPES: Mime_Utils;
    config: any;
    _isRunning: Boolean;
    _httpServer: Boolean;
    _server: http.Server;
    _scenes: any;
    _wsServer: WebSocketServer;
    _protocol: any;
    _sockets: any;
}
declare class BelugaServer {
    constructor(config: any);
    listen(host: string, cwd: string): void;
    getSocketByID(id: string): any;
    handleExceptions(error: Error): void;
    createNewScene(playerMax?: number): Scene;
    returnAvailableScenes(id?: string, playerMax?: number): Scene;
    routeReq(req: http.IncomingMessage, res: http.ServerResponse, cwd: string): void;
}

export { BelugaServer };
