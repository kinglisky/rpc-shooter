import { RPCMessageEvent, RPC } from './lib';
import { methods, initMainCases } from './cases';
import RPCSelfWorker from './worker?worker';
import RPCSharedWorker from './shared.worker?sharedworker';
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
    worker.port.start();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: worker.port,
            targetEndpoint: worker.port,
        }),
    });
    return initMainCases({
        rpc,
        methods,
        desc: 'Shared worker',
    });
}

function initWindowCases() {
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
    return initMainCases({
        rpc,
        methods,
        desc: 'new window',
    });
}

(window as any).runMainCases = initIframeCases();
(window as any).runSelfWorkerCases = initSelfWorkerCases();
(window as any).runSharedWorkerCases = initSharedWorkerCases();
(window as any).runWindowCases = initWindowCases();
