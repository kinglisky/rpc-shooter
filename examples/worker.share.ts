import { RPCMessageEvent, RPC } from '../src/index';
import { BMethods } from './methods';
interface SharedWorkerGlobalScope {
    onconnect: (event: MessageEvent) => void;
}
const ctx: SharedWorkerGlobalScope = self as any;
const sharedData = Date.now();

ctx.onconnect = (event: MessageEvent) => {
    console.log(event);
    const port = event.ports[0];
    port.start();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: port,
            targetEndpoint: port,
        }),
        methods: BMethods,
    });

    rpc.registerMethod('B.sharedData', () => {
        return sharedData;
    });
    rpc.connect(2000).then(() => {
        rpc.invoke('A.add', [1, 2]).then((res) => {
            console.log(`B invoke A.add result: ${res}`);
        });
    });
};
