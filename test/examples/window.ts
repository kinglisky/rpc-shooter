import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';
import './style.css';

const rpc = new RPC({
    event: new RPCMessageEvent({
        currentEndpoint: window,
        targetEndpoint: window.opener,
        config: { targetOrigin: '*' },
    }),
});
initChildCases({
    rpc,
    methods,
    desc: 'new window',
});
