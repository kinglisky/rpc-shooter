import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';
import './style.css';

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
