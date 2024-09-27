import * as utils from "./server_utils";
import * as http from 'http';
import { WebSocketServer } from "ws";
import { Scene } from "../scene/Scene";
interface BelugaServer {
    MIME_TYPES: utils.Mime_Utils;
    config: any;
    _isRunning: Boolean;
    _httpServer: Boolean;
    _server: http.Server;
    _scenes: any;
    _wsServer: WebSocketServer;
    _protocol: any;
}
declare class BelugaServer {
    constructor(config: any);
    listen(host: string): void;
    getSocketByID(id: string): any;
    handleExceptions(error: Error): void;
    createNewScene(playerMax?: number): Scene;
    returnAvailableScenes(id?: string, playerMax?: number): any;
    routeReq(req: http.IncomingMessage, res: http.ServerResponse): void;
}
export { BelugaServer };
