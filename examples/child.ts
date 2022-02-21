import { RPCMessageEvent, RPC } from '../src/index';
import './child.css';

const textarea = document.querySelector('textarea')!;
const message = (msg: string) => {
  textarea.value = msg;
};

const rpc = new RPC({
  event: new RPCMessageEvent({
    currentContext: window,
    targetContext: window.top,
    origin: '*',
  }),
});

rpc.registerMethod('child.now', () => {
  return Promise.resolve(Date.now());
});

rpc.invoke('parent.add', [1, 2]).then((res) => {
  message(`child invoke parent.add result: ${res}`);
});

console.log('child iframe rpc', rpc);
