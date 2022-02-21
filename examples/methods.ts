import { RPCInitOptions, RPC } from '../src/index';

export const AMethods: RPCInitOptions['methods'] = {
    'A.add': (args: [a: number, b: number]) => {
        return args[0] + args[1];
    },
};

export const BMethods: RPCInitOptions['methods'] = {
    'B.now': () => {
        return Promise.resolve(Date.now());
    },
};

export const invokeMethods = (
    rpc: RPC,
    methods: RPCInitOptions['methods']
) => {};
