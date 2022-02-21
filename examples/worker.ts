import { RPCMessageEvent, RPC } from '../src/index';
import RPCWorker from './worker.self?worker';
import { AMethods } from './methods';
import './style.css';

const worker = new RPCWorker();

const rpc = new RPC({
  event: new RPCMessageEvent({
    currentContext: worker,
    targetContext: worker,
  }),
  methods: AMethods,
});

rpc.invoke('B.now', null).then((res) => {
  console.log(`A invoke B.now result: ${res}`);
});
