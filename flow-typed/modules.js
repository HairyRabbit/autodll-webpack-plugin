// @flow

declare module "@rabbitcc/autodll-webpack-plugin" {
  declare class Class0 {

    description: string;
    addToAssets(compilation: any, callback: Function): void;
    apply(compiler: Function): void;
  }
  declare export type Options = {cachename: string, debug: boolean, disabled: boolean, exclude: [], host: string, include: [], injectBabelPolyfill: boolean, injectDevClientScript: boolean, makeOptions: Function, manifest: string, name: string, output: string, port: string, watch: boolean};
  declare export default class AutoDllWebpackPlugin {

    applyHtmlPlugin: Function;
    applyRefPlugin: Function;
    cachePath: string;
    compiler: any;
    context: string;
    deps: Array<string>;
    description: string;
    flag: string;
    initBuild: boolean;
    installBabelPolyfill: boolean;
    installDevClientScript: boolean;
    log: Function;
    manifestPath: string;
    options: {cachename: string, debug: boolean, disabled: boolean, exclude: [], host: string, include: [], injectBabelPolyfill: boolean, injectDevClientScript: boolean, makeOptions: Function, manifest: string, name: string, output: string, port: string, watch: boolean};
    pkg: Object;
    pkgPath: string;
    plugin: Function;
    pluginID: string;
    report: Function;
    status: Object;
    timestamp: number;
    webpack4: boolean;
    webpackOptions: Object;
    _log(method: string, str: string, ...args: Array<string>): void;
    apply(compiler: any): void;
    applyHtmlPlugin(compilation: any): void;
    applyRefPlugin(compiler: Function): void;
    build(done: Function, callback: Function): void;
    cache(): Class0;
    check(): ?boolean;
    constructor(options: {cachename: string, debug: boolean, disabled: boolean, exclude: [], host: string, include: [], injectBabelPolyfill: boolean, injectDevClientScript: boolean, makeOptions: Function, manifest: string, name: string, output: string, port: string, watch: boolean}): void;
    getDeps(): Array<string>;
    init(callback: Function, mtime: ?number): void;
    log(...args: Array<string>): void;
    make(): Object;
    plugin(watcherOrCompiler: Object, callback: Function): void | void;
    renderDeps(): string;
    report(): void;
  }
}
