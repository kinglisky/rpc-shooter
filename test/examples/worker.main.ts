import { RPCMessageEvent, RPC } from './lib';
import RPCWorker from './worker.child?worker';
import imagURL from './test.jpg';
import './style.css';

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

(async function () {
    const worker = new RPCWorker();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentEndpoint: worker,
            targetEndpoint: worker,
            sendAdapter(data) {
                const transfer = [];
                JSON.stringify(data, (_, value) => {
                    if (value?.constructor.name === 'ImageBitmap') {
                        transfer.push(value);
                    }
                    return value;
                });
                return { data, transfer };
            },
        }),
    });
    const image = await loadImage(imagURL);
    const imageDataMap = await window.createImageBitmap(image);
    const grayImage = document.querySelector('.gray') as HTMLImageElement;
    await rpc.invoke('toGray', imageDataMap).then((res: ImageData) => {
        const canvas = document.createElement('canvas');
        canvas.width = res.width;
        canvas.height = res.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(res, 0, 0);
        grayImage.setAttribute('src', canvas.toDataURL());
    });

    // await rpc.invoke('toGray', document.querySelector('body'));
})();
