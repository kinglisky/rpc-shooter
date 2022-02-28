import { RPCMessageEvent, RPC } from '../src/index';
import { AMethods } from './methods';
import './style.css';

(async function () {
    const iframe = document.querySelector('iframe')!;

    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: window,
            targetEndpoint: iframe.contentWindow!,
            config: { targetOrigin: '*' },
        }),
        methods: AMethods,
    });
    await rpc.connect(2000);
    console.log('main rpc connected');
    await rpc.invoke('B.now', null).then((res) => {
        console.log(`A invoke B.now result: ${res}`);
    });
    // not found method
    await rpc.invoke('C.now', null).then((res) => {
        console.log(`A invoke C.now result: ${res}`);
    });
})();
