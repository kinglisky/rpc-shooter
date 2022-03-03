import { RPCMessageEvent, RPC } from './lib';
import { methods, initCases } from './cases';
import './style.css';

const iframe = document.querySelector('iframe')!;
const rpc = new RPC({
    event: new RPCMessageEvent({
        currentEndpoint: window,
        targetEndpoint: iframe.contentWindow!,
        config: { targetOrigin: '*' },
    }),
});

(window as any).rpc = rpc;
(window as any).methods = methods;
(window as any).runCases = initCases(rpc, methods, 'Iframe main invoke child method');