import { RPCMessageEvent, RPC } from './lib';

const ctx: WorkerGlobalScope = self as any;
const rpc = new RPC({
    event: new RPCMessageEvent({
        currentEndpoint: ctx,
        targetEndpoint: ctx,
    }),
});

function toGray(data: ImageData): ImageData {
    const calculateGray = (r: number, g: number, b: number) =>
        Math.floor(r * 0.299 + g * 0.587 + b * 0.114);
    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            const idx = (x + y * data.width) * 4;
            const r = data.data[idx + 0];
            const g = data.data[idx + 1];
            const b = data.data[idx + 2];
            const gray = calculateGray(r, g, b);
            data.data[idx + 0] = gray;
            data.data[idx + 1] = gray;
            data.data[idx + 2] = gray;
        }
    }
    return data;
}

function getImageData(data: ImageBitmap) {
    const canvas = new OffscreenCanvas(data.width, data.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(data, 0, 0);
    return ctx.getImageData(0, 0, data.width, data.height);
}

rpc.registerMethod('toGray', (data) => {
    return toGray(getImageData(data));
});
