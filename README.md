# rpc-shooter

A tool library for handling window && iframe && worker communication based on the JSON RPC specification

一个基于 [JSON-RPC](https://wiki.geekdream.com/Specification/json-rpc_2.0.html) 规范用于处理 window && iframe && worker 通讯的工具库

## 为什么要写这个工具？

使用 `iframe` 与 `Web Worker` 经常需要写如下代码：

iframe 中的服务调用

```javascript
// parent.js
const childWindow = document.querySelector('iframe').contentWindow;
window.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 'do_something') {
        // ... handle iframe data
        childWindow.postMessage({
            event: 're:do_something',
            data: 'some data',
        });
    }
});

// iframe.js
window.top.postMessage(
    {
        event: 'do_something',
        data: 'ifame data',
    },
    '*'
);
window.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 're:do_something') {
        // ... handle parent data
    }
});
```

worker 服务调用

```javascript
// parent.js
const worker = new Worker('worker.js');
worker.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 'do_something') {
        // ... handle worker data
        worker.postMessage({
            event: 're:do_something',
            data: 'some data',
        });
    }
});

// worker.js
self.postMessage({
    event: 'do_something',
    data: 'worker data',
});
self.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 're:do_something') {
        // ... handle parent data
    }
});
```

上述的方式可以处理简单的事件通信，但针对复杂场景下跨页面（进程）通信需要一个简单的有效的处理方式，如果可以封装成异步函数调用方式，则会优雅很多，如下：

```javascript
// parent.js
const parentRPC = new RPC({...});
parentRPC.registerMethod('parent.do_something', (data) => {
    return Promise.resolve({...});
});
parentRPC.invoke('child.do_something', { data: 'xxx' })
    .then(res => {
        console.error(res);
    })
    .catch(error => {
        console.error(error);
    });

// child.js
const childRPC = new RPC({...});
childRPC.registerMethod('child.do_something', (data) => {
    return Promise.resolve({...});
});
childRPC.invoke('parent.do_something', { data: 'xxx' })
    .then(res => {
        console.error(res);
    })
    .catch(error => {
        console.error(error);
    });
```

使用 [JSON-RPC 2.0](https://wiki.geekdream.com/Specification/json-rpc_2.0.html) 规范可以很简单的描述两个服务间的调用，`rpc-shooter` 中两个服务间通讯的数据格式就是使用 JSON-RPC 描述的。

## 安装

```bash
yarn add rpc-shooter
# or
npm i rpc-shooter -S
```

## 使用

### iframe

```ts
// main.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';

(async function () {
    const iframe = document.querySelector('iframe')!;
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: window,
            targetContext: iframe.contentWindow!,
            postMessageConfig: { targetOrigin: '*' },
        }),
        // 初始化时注册处理函数
        methods: {
            'Main.max': (a: number, b: number) => Math.max(a, b),
        },
    });
    // 动态注册处理函数
    rpc.registerMethod('Main.min', (a: number, b: number) => {
        return Promise.resolve(Math.min(a, b));
    });

    // 检查链接，配置超时时间
    await rpc.connect(2000);

    // 调用 iframe 服务中的注册方法
    const randomValue = await rpc.invoke('Child.random', null, { isNotify: false, timeout: 2000 });
    console.log(`Main invoke Child.random result: ${randomValue}`);
})();
```

```ts
// child.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';
(async function () {
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: window,
            targetContext: window.top,
        }),
    });

    rpc.registerMethod('Child.random', () => Math.random());

    await rpc.connect(2000);

    const max = await rpc.invoke('Main.max', [1, 2]);
    const min = await rpc.invoke('Main.min', [1, 2]);
    console.log({ max, min });
})();
```

### window

```ts
// main.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';
(async function () {
    const openNewWindow = (path: string) => {
        return window.open(path, '_blank');
    };
    const newWindow = openNewWindow('new-window.html');
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: window,
            targetContext: newWindow,
            postMessageConfig: { targetOrigin: '*' },
        }),
    });
    rpc.registerMethod('Main.max', (a: number, b: number) => {
        return Promise.resolve(Math.max(a, b));
    });
    await rpc.connect(2000);
    await rpc.invoke('Child.random', null);
})();
```

```ts
// child.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';
(async function () {
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: window,
            targetContext: window.opener,
        }),
    });
    rpc.registerMethod('Child.random', () => Math.random());

    await rpc.connect(2000);

    await rpc.invoke('Main.max', [1, 2]);
})();
```

### Web Worker

```ts
// main.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';

(async function () {
    const worker = new Worker('./slef.worker.ts');
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: worker,
            targetContext: worker,
        }),
    });
    rpc.registerMethod('Main.max', (a: number, b: number) => {
        return Promise.resolve(Math.max(a, b));
    });
    await rpc.connect(2000);
    await rpc.invoke('Child.random', null);
})();
```

```ts
// child.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';

(async function () {
    const ctx: Worker = self as any;
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: ctx,
            targetContext: ctx,
        }),
    });
    rpc.registerMethod('Child.random', () => Math.random());

    await rpc.connect(2000);

    await rpc.invoke('Main.max', [1, 2]);
})();
```

### Shared Worker

```ts
// main.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';

(async function () {
    const worker: SharedWorker = new SharedWorker('./shared.worker.ts');
    worker.port.start();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: worker.port,
            targetContext: worker.port,
        }),
    });
    rpc.registerMethod('Main.max', (a: number, b: number) => {
        return Promise.resolve(Math.max(a, b));
    });
    await rpc.connect(2000);
    await rpc.invoke('Child.random', null);
})();
```

```ts
// child.ts
import { RPCMessageEvent, RPC } from '@rpc-shooter';

interface SharedWorkerGlobalScope {
    onconnect: (event: MessageEvent) => void;
}

const ctx: SharedWorkerGlobalScope = self as any;

ctx.onconnect = async (event: MessageEvent) => {
    const port = event.ports[0];
    port.start();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: port,
            targetContext: port,
        }),
    });
    rpc.registerMethod('Child.random', () => Math.random());

    await rpc.connect(2000);

    await rpc.invoke('Main.max', [1, 2]);
};
```
