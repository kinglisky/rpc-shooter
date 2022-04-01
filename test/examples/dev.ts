import { RPCMessageEvent, RPC } from './lib';

(async function () {
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
    rpc2.registerMethod('add', (a: number, b: number, c: number) => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(a + b + c), 400);
        });
    });
    const res1 = await rpc1.invoke('add', 1, 2, 3);
    const res2 = await rpc1.invoke('add', 4, 5, 6, { isNotify: true });
    const res3 = await rpc1.invoke('add', 7, 8, 9, { timeout: 1000 });
    const res4 = await rpc1.invoke('add', 10, 11, 12, { timeout: 4 }).catch((error) => error);
    console.log({ res1, res2, res3, res4 });
})();
