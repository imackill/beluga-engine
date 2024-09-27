import { BelugaServer } from "../BelugaServer";
interface RPC {
    constants: Map<string, number | string>;
    _functions: Array<any>;
    _server: BelugaServer;
    name: string;
}
declare class RPC {
    constructor(server: BelugaServer);
    handle(event: string, ...args: any[]): any;
    onconnection(ws: WebSocket): {
        type: string;
        payload: {
            id: any;
            protocol: string;
        };
        time: number;
    };
    onmessage(ws: WebSocket, message: string): void;
    onclose(ws: WebSocket, date: number): void;
}
export { RPC };
