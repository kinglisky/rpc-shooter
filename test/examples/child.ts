import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';
import './style.css';

function initIframeCases() {
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: window,
            targetEndpoint: window.top,
        }),
    });

    initChildCases({
        rpc,
        methods,
        desc: 'iframe',
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
    return initChildCases({
        rpc,
        methods,
        desc: 'BroadcastChannel',
    });
}

// initIframeCases();
// initBroadcastChannelCases();
