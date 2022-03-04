import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';

interface SharedWorkerGlobalScope {
    onconnect: (event: MessageEvent) => void;
}

const ctx: SharedWorkerGlobalScope = self as any;

ctx.onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    port.start();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: port,
            targetEndpoint: port,
        }),
    });
    initChildCases({ rpc, methods, desc: 'Shared worker' });
};
