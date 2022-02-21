import { RPCMessageEvent, RPC } from '../src/index';
import './style.css';

const textarea = document.querySelector('textarea')!;
const message = (msg: string) => {
  textarea.value = msg;
};

const iframe = document.querySelector('iframe')!;

const iframeRPC = new RPC({
  event: new RPCMessageEvent({
    currentContext: window,
    targetContext: iframe.contentWindow!,
    origin: '*',
  }),
});

iframeRPC.registerMethod('parent.add', (args: [number, number]) => {
  return args[0] + args[1];
});

setTimeout(() => {
  iframeRPC.invoke('child.now', null).then((res) => {
    message(`parent invoke child child.now result: ${res}`);
  });
}, 1000);

console.log('parent iframe rpc', iframeRPC);
