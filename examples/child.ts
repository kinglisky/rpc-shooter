import { RPCMessageEvent, RPC } from '../src/index';
import { BMethods } from './methods';
import './style.css';

(async function () {
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: window,
            targetEndpoint: window.top,
        }),
        methods: BMethods,
    });
    await rpc.connect(2000);
    console.log('child rpc connected');
    rpc.invoke('A.add', [1, 2]).then((res) => {
        console.log(`B invoke A.add result: ${res}`);
    });

    rpc.invoke('A.abs', -3).then((res) => {
        console.log(`B invoke A.abs result: ${res}`);
    });

    rpc.invoke('C.add', [1, 2]).then((res) => {
        console.log(`B invoke C.add result: ${res}`);
    });
})();
