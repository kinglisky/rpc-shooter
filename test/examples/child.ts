import { RPCMessageEvent, RPC } from './lib';
import { methods, initCases } from './cases';
import './style.css';

const rpc = new RPC({
    event: new RPCMessageEvent({
        currentEndpoint: window,
        targetEndpoint: window.top,
    }),
});

(window as any).rpc = rpc;
(window as any).methods = methods;
(window as any).runCases = initCases(rpc, methods, 'Iframe child invoke main method');
