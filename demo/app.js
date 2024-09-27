import { BelugaServer } from "../dist/Beluga-engine.js"
import * as path from 'path';


//init server with port 8000 and entry point index.html
let server = new BelugaServer({
    PORT: 8000,
    htmlEntry: "./public/index.html"
});

//listen server on hostname
server.listen('localhost', path.join(process.cwd(), "demo"));

