import { RPCMessageEvent, RPC } from '../src/index';
import RPCWorker from './worker.self?worker';
import { AMethods } from './methods';
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

function getImageData(img: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

(async function () {
    const worker = new RPCWorker();
    const rpc = new RPC({
        event: new RPCMessageEvent({
            currentContext: worker,
            targetContext: worker,
            postMessageConfig(data) {
                if (data.data) {
                    return { data, transferList: [data.data] };
                }
                return { data };
            },
        }),
        methods: AMethods,
    });

    await rpc.invoke('B.now', null).then((res) => {
        console.log(`A invoke B.now result: ${res}`);
    });

    const image = await loadImage(imagURL);
    const imageData = getImageData(image);
    const grayImage = document.querySelector('.gray') as HTMLImageElement;
    await rpc.invoke('B.toGray', imageData).then((res: ImageData) => {
        const canvas = document.createElement('canvas');
        canvas.width = res.width;
        canvas.height = res.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(res, 0, 0);
        grayImage.setAttribute('src', canvas.toDataURL());
    });
})();
