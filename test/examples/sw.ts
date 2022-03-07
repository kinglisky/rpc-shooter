import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';

const ctx: ServiceWorkerGlobalScope = self as any;

function getClients() {
    return new Promise((resolve, reject) => {
        ctx.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(resolve, reject);
    });
}

ctx.addEventListener('message', (event) => {
    console.log('sw on message', event.data);
});

ctx.addEventListener('activate', (event: ExtendableEvent) => {
    getClients().then((clients) => {
        clients.forEach((client) => {
            if (client.frameType === 'top-level') {
                client.postMessage('client activate');
                const rpc = new RPC({
                    event: new RPCMessageEvent({
                        currentEndpoint: ctx,
                        targetEndpoint: client,
                    }),
                });
                initChildCases({
                    rpc,
                    methods,
                    desc: 'ServiceWorker',
                });
                console.log('sw activate', client);
            }
        });
    });
});
