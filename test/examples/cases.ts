import { RPC } from './lib';

function ab2str(buf: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    const buf = new ArrayBuffer(str.length * 2);
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

interface Method {
    name: string;
    params: any;
    fn: (...args: any[]) => any;
}
export const methods: Method[] = [
    {
        name: 'add',
        fn: ([a, b]) => a + b,
        params: [1, 2],
    },
    {
        name: 'subtract',
        fn: ([a, b]) => Promise.resolve(a - b),
        params: [2, 1],
    },
    {
        name: 'str2ab',
        fn: str2ab,
        params: 'abs',
    },
    {
        name: 'ab2str',
        fn: ab2str,
        params: str2ab('abs'),
    },
];

export interface TestResult {
    name: string;
    case: { result?: any; error?: any };
    expect: { result?: any; error?: any };
}

const CHILD_METHOD_NAME = 'runChildCases';

function initCases(
    options: { rpc: RPC; methods: Method[]; desc: string },
    isMain: boolean = false
) {
    const { rpc, methods, desc } = options;
    methods.forEach((method) => {
        rpc.registerMethod(method.name, method.fn);
    });

    return async function runCases() {
        await rpc.connect();
        const cases = methods.map((method) => {
            const name = isMain
                ? `${desc} main invoke child ---> ${method.name}`
                : `${desc} child invoke main ---> ${method.name}`;
            return {
                name,
                case: () => {
                    return rpc.invoke(method.name, method.params);
                },
                expect: () => {
                    return Promise.resolve(method.fn(method.params));
                },
            };
        });
        const promises = cases.map(async (caseItem) => {
            const expectRes = await caseItem
                .expect()
                .then((result) => ({ result }))
                .catch((error) => ({ error: error.message }));
            console.log(`${caseItem.name} ~ expect:`, expectRes);

            const caseRes = await caseItem
                .case()
                .then((result) => ({ result }))
                .catch((error) => ({ error: error.message }));
            console.log(`${caseItem.name} ~ case:`, caseRes);

            return {
                name: caseItem.name,
                case: caseRes,
                expect: expectRes,
            } as TestResult;
        });
        return Promise.all(promises);
    };
}

export function initMainCases(options: { rpc: RPC; methods: Method[]; desc: string }) {
    const runCases = initCases(options, true);

    return async () => {
        const main = await runCases();
        const child = await options.rpc.invoke(CHILD_METHOD_NAME, null);
        return { main, child };
    };
}

export function initChildCases(options: { rpc: RPC; methods: Method[]; desc: string }) {
    options.rpc.registerMethod(CHILD_METHOD_NAME, initCases(options, false));
}
