import { RPCMessageEvent, RPC } from '../src/index';
import { BMethods } from './methods';

const ctx: Worker = self as any;
const rpc = new RPC({
    event: new RPCMessageEvent({
        currentContext: ctx,
        targetContext: ctx,
    }),
    methods: BMethods,
});

rpc.invoke('A.add', [1, 2]).then((res) => {
    console.log(`B invoke A.add result: ${res}`);
});
