import { RPCMessageEvent, RPC } from './lib';
import { methods, initMainCases, initChildCases } from './cases';
import RPCSelfWorker from './worker?worker';
import RPCSharedWorker from './shared.worker?sharedworker';
import './dev';
import './style.css';

function initIframeCases() {
    const iframe = document.querySelector('iframe')!;
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: window,
            targetEndpoint: iframe.contentWindow!,
            config: { targetOrigin: '*' },
        }),
    });
    return initMainCases({
        rpc,
        methods,
        desc: 'iframe',
    });
}

function initSelfWorkerCases() {
    const worker = new RPCSelfWorker();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: worker,
            targetEndpoint: worker,
        }),
    });
    return initMainCases({
        rpc,
        methods,
        desc: 'Self worker',
    });
}

function initSharedWorkerCases() {
    const worker = new RPCSharedWorker();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: worker.port as MessagePort,
            targetEndpoint: worker.port as MessagePort,
        }),
    });
    return initMainCases({
        rpc,
        methods,
        desc: 'Shared worker',
    });
}

function initWindowCases() {
    return () => {
        const openNewWindow = (path: string) => {
            return window.open(path, '_blank');
        };
        const rpc = new RPC({
            event: new RPCMessageEvent({
                currentEndpoint: window,
                targetEndpoint: openNewWindow('window.html'),
                config: { targetOrigin: '*' },
            }),
        });
        const run = initMainCases({
            rpc,
            methods,
            desc: 'new window',
        });
        return run();
    };
}

function initMessageChannelCases() {
    const mc = new MessageChannel();
    const rpc1 = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: mc.port1,
            targetEndpoint: mc.port1,
        }),
    });
    const rpc2 = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: mc.port2,
            targetEndpoint: mc.port2,
        }),
    });
    initChildCases({
        rpc: rpc2,
        methods,
        desc: 'MessageChannel',
    });
    return initMainCases({
        rpc: rpc1,
        methods,
        desc: 'MessageChannel',
    });
}

function initBroadcastChannelCases() {
    const bc = new BroadcastChannel('BroadcastChannelTest');
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: bc,
            targetEndpoint: bc,
        }),
    });
    return initMainCases({
        rpc,
        methods,
        desc: 'BroadcastChannel',
    });
}

function initServiceWorkerCases() {
    function init() {
        const endpoint = window.navigator.serviceWorker.controller;
        if (endpoint) {
            console.log(endpoint);
            const rpc = new RPC({
                event: new RPCMessageEvent({
                    currentEndpoint: endpoint,
                    targetEndpoint: endpoint,
                }),
            });
            return initMainCases({
                rpc,
                methods,
                desc: 'BroadcastChannel',
            });
        }
    }
    window.navigator.serviceWorker
        .register('./sw.ts?dev-sw', { type: 'module' })
        .then((registration) => {
            if (registration.installing) {
                console.log('ServiceWorker installing');
            }
            if (registration.waiting) {
                console.log('ServiceWorker waiting');
            }
            if (registration.active) {
                console.log('ServiceWorker active');
                init();
            }
        });
}

function initAllCases() {
    const runIframeCases = initIframeCases();
    const runSelfWorkerCases = initSelfWorkerCases();
    const runSharedWorkerCases = initSharedWorkerCases();
    const runWindowCases = initWindowCases();
    const runMessageChannelCases = initMessageChannelCases();
    const runBroadcastChannelCases = initBroadcastChannelCases();
    // const runServiceWorkerCases = initServiceWorkerCases();

    (window as any).runIframeCases = runIframeCases;
    (window as any).runSelfWorkerCases = runSelfWorkerCases;
    (window as any).runSharedWorkerCases = runSharedWorkerCases;
    (window as any).runWindowCases = runWindowCases;
    (window as any).runMessageChannelCases = runMessageChannelCases;
    (window as any).runBroadcastChannelCases = runBroadcastChannelCases;
    // (window as any).runServiceWorkerCases = runServiceWorkerCases;

    return () => {
        return Promise.all([
            runIframeCases(),
            runSelfWorkerCases(),
            runSharedWorkerCases(),
            runWindowCases(),
            runMessageChannelCases(),
            runBroadcastChannelCases(),
        ]);
    };
}

(window as any).runAllCases = initAllCases();
