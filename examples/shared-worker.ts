import { RPCMessageEvent, RPC } from '../src/index';
import SWorker from './worker.share?sharedworker';
import { AMethods } from './methods';
import './style.css';

(async function () {
    const worker: SharedWorker = new SWorker();
    worker.port.start();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: worker.port,
            targetContext: worker.port,
        }),
        methods: AMethods,
    });

    await rpc.connect(2000);

    rpc.invoke('B.now', null).then((res) => {
        console.log(`A invoke B.now result: ${res}`);
    });

    rpc.invoke('B.sharedData', null).then((res) => {
        console.log(`A invoke B.sharedData result: ${res}`);
    });
})();
