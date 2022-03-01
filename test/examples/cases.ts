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

export function initCases(rpc: RPC, methods: Method[], caseDesc: string) {
    methods.forEach((method) => {
        rpc.registerMethod(method.name, method.fn);
    });
    const cases = methods.map((method) => {
        const name = `${caseDesc}:${method.name}`;
        return {
            name,
            case: () => {
                return rpc.invoke(method.name, method.params);
            },
            expect: () => {
                console.log(`${name}:run expect`);
                return Promise.resolve(method.fn(method.params));
            },
        };
    });
    return async function runCases() {
        await rpc.connect();
        const promises = cases.map(async (caseItem) => {
            const expectRes = await caseItem
                .expect()
                .then((result) => ({ result }))
                .catch((error) => ({ error: error.message }));
            console.log(`${caseItem.name} ~ run expect:`, expectRes);

            const caseRes = await caseItem
                .case()
                .then((result) => ({ result }))
                .catch((error) => ({ error: error.message }));
            console.log(`${caseItem.name} ~ run case:`, caseRes);

            return {
                name: caseItem.name,
                case: caseRes,
                expect: expectRes,
            } as TestResult;
        });
        return Promise.all(promises);
    };
}
