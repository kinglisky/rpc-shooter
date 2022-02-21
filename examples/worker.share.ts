import { RPCMessageEvent, RPC } from '../src/index';

const ctx: Worker = self as any;

const rpc = new RPC({
  event: new RPCMessageEvent({
    currentContext: ctx,
    targetContext: ctx,
  }),
});
rpc.registerMethod('child.now', () => {
  return Promise.resolve(Date.now());
});

rpc.invoke('parent.random', 100).then((res) => {
  console.log(`child invoke parent.random result: ${res}`);
});
console.log('child worker rpc', rpc);
