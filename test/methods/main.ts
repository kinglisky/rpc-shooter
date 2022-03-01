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

export const methods = [
    {
        name: 'add',
        fn: (a, b) => a + b,
        args: [1, 2],
    },
    {
        name: 'subtract',
        fn: (a, b) => Promise.resolve(a - b),
        args: [2, 1],
    },
    {
        name: 'str2ab',
        fn: str2ab,
        args: ['abs'],
    },
    {
        name: 'ab2str',
        fn: ab2str,
        args: [str2ab('abs')],
    },
];
