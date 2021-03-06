import { RPCMessageEvent, RPC } from './lib';
import { methods, initChildCases } from './cases';

const ctx: Worker = self as any;
const rpc = new RPC({
    event: new RPCMessageEvent({
        currentEndpoint: ctx,
        targetEndpoint: ctx,
    }),
});

initChildCases({
    rpc,
    methods,
    desc: 'Self worker',
});
