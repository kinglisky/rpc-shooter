import { RPCMessageEvent, RPC } from '../src/index';
import { AMethods } from './methods';
import './style.css';

(async function () {
    const rpcList: Array<RPC> = [];
    const openNewWindow = (path: string) => {
        return window.open(path, '_blank');
    };
    document.querySelector('#open-window').addEventListener('click', async () => {
        const newWindow = await openNewWindow('window2.html');
        const rpc = new RPC({
            event: new RPCMessageEvent({
                currentEndpoint: window,
                targetEndpoint: newWindow,
                config: { targetOrigin: '*' },
            }),
            methods: AMethods,
        });
        await rpc.connect(2000);
        console.log('rpc connected');
        await rpc.invoke('B.now', null).then((res) => {
            console.log(`A invoke B.now result: ${res}`);
        });
        rpcList.push(rpc);
        console.log(rpcList);
    });
})();
