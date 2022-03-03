import { RPCInitOptions, RPC } from './lib';

export const AMethods: RPCInitOptions['methods'] = {
    'A.add': (args: [a: number, b: number]) => {
        return args[0] + args[1];
    },
    'A.abs': (a: number) => Math.abs(a),
};

export const BMethods: RPCInitOptions['methods'] = {
    'B.now': () => {
        return Promise.resolve(Date.now());
    },
};

export const invokeMethods = (rpc: RPC, methods: RPCInitOptions['methods']) => {};