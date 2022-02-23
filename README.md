A JSON-RPC library of tools for handling communication between services

基于 [JSON-RPC 2.0](https://wiki.geekdream.com/Specification/json-rpc_2.0.html) 规范的远程服务调用库。

## 为什么要写这个工具？

使用 `iframe` 与 `Web Worker` 经常需要写如下代码：

iframe 中的服务调用

```javascript
// parent.js
const childWindow = document.querySelector('iframe').contentWindow;
window.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 'do_someting') {
        // ... handle iframe data
        childWindow.postMessage({
            event: 're:do_someting',
            data: 'some data',
        });
    }
});

// iframe.js
window.top.postMessage(
    {
        event: 'do_someting',
        data: 'ifame data',
    },
    '*'
);
window.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 're:do_someting') {
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
    if (data.event === 'do_someting') {
        // ... handle worker data
        worker.postMessage({
            event: 're:do_someting',
            data: 'some data',
        });
    }
});

// worker.js
self.postMessage({
    event: 'do_someting',
    data: 'worker data',
});
self.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 're:do_someting') {
        // ... handle parent data
    }
});
```

上述的方式可以处理简单的事件通信，但针对复杂场景下跨页面（进程）通信，或者说是服务调用则需要一个简单的有效的处理方式，如果可以封装成异步函数调用方式，则会优雅很多，如下：

```javascript
// parent.js
const parentRPC = new RPC({...});
parentRPC.registerMethod('parent.do_sometion', (data) => {
    // handle data && return
    return Promise.resolve({...});
});
parentRPC.invoke('child.do_sometion', { data: 'xxx' })
    .then(res => {
        // get child data
        console.error(res);
    })
    .catch(error => {
        console.error(error);
    });

// child.js
const childRPC = new RPC({...});
childRPC.registerMethod('child.do_sometion', (data) => {
    // handle data && return
    return Promise.resolve({...});
});
childRPC.invoke('parent.do_sometion', { data: 'xxx' })
    .then(res => {
        // get parent data
        console.error(res);
    })
    .catch(error => {
        console.error(error);
    });
```

[JSON-RPC 2.0](https://wiki.geekdream.com/Specification/json-rpc_2.0.html) 规范很简单也很适合描述两个服务间调用，于是基于 JSON-RPC （用来描述服务间传递的数据格式）封装了一个用于 iframe 与 worker 服务调用的工具库。

## 使用

### 安装

```bash
yarn add rpc-shooter -S
# or
npm i rpc-shooter -S
```

### 使用

<!-- 明天写~ -->
