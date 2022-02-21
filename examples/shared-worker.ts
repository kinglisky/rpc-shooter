import { RPCMessageEvent, RPC } from '../src/index';
// import RPCWorker from './worker.self?worker';
import './style.css';

// const textarea = document.querySelector('textarea')!;
// const message = (msg: string) => {
//   textarea.value = msg;
// };

// const worker = new RPCWorker();

// const workerRPC = new RPC({
//   event: new RPCMessageEvent({
//     currentContext: worker,
//     targetContext: worker,
//   }),
// });

// workerRPC.registerMethod('parent.random', (v) => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve((Math.random() * v) | 0);
//     }, 1000);
//   });
// });

// workerRPC.invoke('child.now', null).then((res) => {
//   message(`parent invoke child child.now result: ${res}`);
// });
console.log('parent worker rpc', workerRPC);
