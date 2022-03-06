import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';

const ctx: ServiceWorkerGlobalScope = self as any;

ctx.addEventListener('install', (event: ExtendableEvent) => {
    console.log('install');
    ctx.clients.matchAll().then(function (clients) {
        console.log('install ServiceWorkerGlobalScope matchAll', clients);
        // clients.forEach(function (client) {
        //     console.log('client', client);
        //     const rpc = new RPC({
        //         event: new RPCMessageEvent({
        //             currentEndpoint: ctx,
        //             targetEndpoint: client,
        //         }),
        //     });

        //     initChildCases({
        //         rpc,
        //         methods,
        //         desc: 'ServiceWorker worker',
        //     });
        // });
    });
});

ctx.addEventListener('activate', (event: ExtendableEvent) => {
    console.log('activate');
    ctx.clients.matchAll().then(function (clients) {
        console.log('activate ServiceWorkerGlobalScope matchAll', clients);
    });
});
