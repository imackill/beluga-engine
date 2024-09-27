

//class used for dynamic mime types on a server, allowing for custom import handling

interface Mime_Utils{
    default: string,
    html: string,
    js: string,
    css: string,
    png: string,
    jpg: string,
    gif: string,
    ico: string,
    ssvg: string,
}

class Mime_Utils{

    #changes: any = {};

    constructor(){
        this.default = "application/octet-stream";
        this.html = "text/html; charset=UTF-8";
        this.js = "application/javascript";
        this.css = "text/css";
        this.png = "image/png";
        this.jpg = "image/jpg";
        this.gif = "image/gif";
        this.ico = "image/x-icon";
        this.ssvg = "image/svg+xml";
    }
    editMime(mimeName: string, mimeValue: string){
        if (Object.keys(this).includes(mimeName)){
            try{
                this.#changes[Object.entries(this.#changes).length] = {
                    target: mimeName,
                    oldMime: Object.getOwnPropertyDescriptor(this, mimeName),
                    newMime: mimeValue,
                }
                Object.defineProperty(this, mimeName, mimeValue);
            }catch(mimeError: unknown){
                console.error(mimeError);
            }
        }
    }
    revertChange(index: number){
        if((index > Object.entries(this.#changes).length+1) && (index != -1)){
            return console.error(`Could not revert MimeUtil change:\n\tindex ${index} not in changelog.`);
        }

    }
    mime(key: string){
        return this[key];
    }
}


//shamelessly stole this idea, but it's super useful
function extend(dest: any, src: any){
    for(let prop in src){
        dest[prop] = src[prop];
    }
}




//export all utils
export { Mime_Utils, extend };