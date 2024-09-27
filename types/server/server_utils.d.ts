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
    mime(key: string): PropertyDescriptor;
}
declare function extend(dest: any, src: any): void;
export { Mime_Utils, extend };
