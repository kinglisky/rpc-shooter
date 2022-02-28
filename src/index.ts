export interface RPCHandler {
    (...args: any[]): any;
}

export interface RPCError {
    code: number;
    message: string;
    data: any;
}

export interface RPCEvent {
    emit(event: string, ...args: any[]): void;
    on(event: string, fn: RPCHandler): void;
    off(event: string, fn?: RPCHandler): void;
    onerror: null | ((error: RPCError) => void);
    destroy?: () => void;
}

export interface RPCMessageDataFormat {
    event: string;
    args: any[];
}

export interface RPCPostMessageConfig {
    targetOrigin?: unknown;
}
export interface RPCMessageEventOptions {
    currentEndpoint: Window | Worker | MessagePort;
    targetEndpoint: Window | Worker | MessagePort;
    config?:
        | ((data: any, context: Window | Worker | MessagePort) => RPCPostMessageConfig)
        | RPCPostMessageConfig;
    sendAdapter?: (
        data: RPCMessageDataFormat,
        context: Window | Worker | MessagePort
    ) => {
        data: RPCMessageDataFormat;
        transferList?: Transferable[];
    };
    receiveAdapter?: (event: MessageEvent) => RPCMessageDataFormat;
}

export const RPCCodes: Record<string, Pick<RPCError, 'code' | 'message'>> = {
    CONNECT_TIMEOUT: {
        code: -32300,
        message: 'Connect timeout',
    },
    APPLICATION_ERROR: {
        code: -32500,
        message: 'Application error',
    },
    METHOD_NOT_FOUND: {
        code: -32601,
        message: `Method not found`,
    },
};

export class RPCMessageEvent implements RPCEvent {
    static WorkerConstructorNames: Array<string> = [
        'DedicatedWorkerGlobalScope',
        'SharedWorkerGlobalScope',
        'Worker',
        'SharedWorker',
        'MessagePort',
    ];
    private _currentEndpoint: RPCMessageEventOptions['currentEndpoint'];
    private _targetEndpoint: RPCMessageEventOptions['targetEndpoint'];
    private _events: Record<string, Array<RPCHandler>>;
    private _originOnmessage: ((event: MessageEvent) => void) | null;
    private _receiveMessage: (event: MessageEvent) => void;

    onerror: null | ((error: RPCError) => void) = null;
    config?: RPCMessageEventOptions['config'];
    sendAdapter?: RPCMessageEventOptions['sendAdapter'];
    receiveAdapter?: RPCMessageEventOptions['receiveAdapter'];

    constructor(options: RPCMessageEventOptions) {
        this._events = {};
        this._currentEndpoint = options.currentEndpoint;
        this._targetEndpoint = options.targetEndpoint;
        this._originOnmessage = null;
        // hooks
        this.config = options.config;
        this.receiveAdapter = options.receiveAdapter;
        this.sendAdapter = options.sendAdapter;

        const receiveMessage = (event: MessageEvent) => {
            const receiveData = this.receiveAdapter
                ? this.receiveAdapter(event)
                : (event.data as RPCMessageDataFormat);
            if (receiveData && typeof receiveData.event === 'string') {
                const eventHandlers = this._events[receiveData.event] || [];
                if (eventHandlers.length) {
                    eventHandlers.forEach((handler) => {
                        handler(...(receiveData.args || []));
                    });
                    return;
                }
                // method not found
                if (this.onerror) {
                    this.onerror({
                        ...RPCCodes.METHOD_NOT_FOUND,
                        data: receiveData,
                    });
                }
            }
        };
        if (this._currentEndpoint.addEventListener) {
            this._currentEndpoint.addEventListener(
                'message',
                receiveMessage as EventListenerOrEventListenerObject,
                false
            );
            this._receiveMessage = receiveMessage;
        } else {
            // some plugine env don't support addEventListener（like figma.ui)
            this._originOnmessage = this._currentEndpoint.onmessage;
            this._currentEndpoint.onmessage = (event: MessageEvent) => {
                if (this._originOnmessage) {
                    this._originOnmessage(event);
                }
                receiveMessage(event);
            };
            this._receiveMessage = this._currentEndpoint.onmessage;
        }
    }

    emit(event: string, ...args: any[]): void {
        const data: RPCMessageDataFormat = {
            event,
            args,
        };
        const result = this.sendAdapter ? this.sendAdapter(data, this._targetEndpoint) : { data };
        const sendData = result.data || data;
        const postMessageConfig = this.config
            ? typeof this.config === 'function'
                ? this.config(sendData, this._targetEndpoint) || {}
                : this.config || {}
            : {};
        const postArgs: any[] = [];
        if (Array.isArray(result.transferList) && result.transferList.length) {
            postArgs.push(result.transferList);
        }
        // in worker env
        if (
            RPCMessageEvent.WorkerConstructorNames.includes(this._targetEndpoint.constructor.name)
        ) {
            this._targetEndpoint.postMessage(sendData, ...postArgs);
            return;
        }
        if (postMessageConfig.targetOrigin) {
            postArgs.unshift(postMessageConfig.targetOrigin);
        }
        // in window env
        this._targetEndpoint.postMessage(sendData, ...postArgs);
    }

    on(event: string, fn: RPCHandler): void {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(fn);
    }

    off(event: string, fn?: RPCHandler): void {
        if (!this._events[event]) return;
        if (!fn) {
            this._events[event] = [];
            return;
        }
        const handlers = this._events[event] || [];
        this._events[event] = handlers.filter((handler) => handler !== fn);
    }

    destroy(): void {
        if (this._currentEndpoint.removeEventListener) {
            this._currentEndpoint.removeEventListener(
                'message',
                this._receiveMessage as EventListenerOrEventListenerObject,
                false
            );
        } else {
            this._currentEndpoint.onmessage = this._originOnmessage;
        }
    }
}

export interface RPCInitOptions {
    event: RPCEvent;
    methods?: Record<string, RPCHandler>;
    timeout?: number;
}

export interface RPCSYNEvent {
    jsonrpc: '2.0';
    method: string;
    params: any;
    id?: string;
}

export interface RPCSACKEvent {
    jsonrpc: '2.0';
    result?: any;
    error?: RPCError;
    id?: string;
}

export interface RPCInvokeOptions {
    isNotify: boolean;
    timeout?: number;
}

export class RPC {
    private _event: RPCEvent;

    private _methods: Record<string, RPCHandler> = {};

    private _timeout: number = 0;

    private _$connect: Promise<void> | null = null;

    static CODES = RPCCodes;

    static EVENT = {
        SYN_SIGN: 'syn:',
        ACK_SIGN: 'ack:',
        CONNECT: '__rpc_connect_event',
        SYNC_METHODS: '__rpc_sync_methods_event',
    };

    static uuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    constructor(options: RPCInitOptions) {
        this._event = options.event;
        this._timeout = options.timeout || 0;
        if (options.methods) {
            Object.entries(options.methods).forEach(([method, handler]) => {
                this.registerMethod(method, handler);
            });
        }
        this._event.onerror = (error) => {
            const { code, message, data } = error;
            if (data.event && Array.isArray(data.args) && data.args.length) {
                const synEventData = data.args[0] as RPCSYNEvent;
                const ackEventName = this._getAckEventName(synEventData.method);
                const ackEventData: RPCSACKEvent = {
                    jsonrpc: '2.0',
                    id: synEventData?.id,
                    error: {
                        code,
                        message,
                        data: synEventData,
                    },
                };
                this._event.emit(ackEventName, ackEventData);
            } else {
                console.error(error);
            }
        };
        this.connect();
    }

    _getSynEventName(method: string): string {
        return `${RPC.EVENT.SYN_SIGN}${method}`;
    }

    _getAckEventName(method: string): string {
        return `${RPC.EVENT.ACK_SIGN}${method}`;
    }

    // check connect
    connect(timeout?: number): Promise<void> {
        if (this._$connect) {
            return this._$connect;
        }
        this._$connect = new Promise((resolve, reject) => {
            const connectTimeout = timeout || this._timeout;
            let connectTimer: ReturnType<typeof setTimeout>;
            if (connectTimeout) {
                connectTimer = setTimeout(() => {
                    const error: RPCError = {
                        ...RPCCodes.TIMEOUT,
                        data: { timeout: connectTimeout },
                    };
                    reject(error);
                }, connectTimeout);
            }
            const connectEventName = RPC.EVENT.CONNECT;
            const connectAckEventName = this._getAckEventName(connectEventName);
            const connectSynEventName = this._getSynEventName(connectEventName);
            const resolveConnectEvent = () => {
                clearTimeout(connectTimer);
                resolve();
            };
            // listen connect ask event && resolve
            this._event.on(connectAckEventName, resolveConnectEvent);
            const connectSynEventHandler = () => {
                // send ack
                this._event.emit(connectAckEventName);
                resolveConnectEvent();
            };
            // listen connect syn event && resolve
            this._event.on(connectSynEventName, connectSynEventHandler);
            // send syn
            this._event.emit(connectSynEventName);
        });
        return this._$connect;
    }

    registerMethod(method: string, handler: RPCHandler) {
        if (this._methods[method]) {
            throw new Error(`${method} already registered`);
        }
        this._methods[method] = handler;
        const synEventName = this._getSynEventName(method);
        const synEventHandler = (synEventData: RPCSYNEvent) => {
            const ackEventName = this._getAckEventName(method);
            // notify not need ack
            if (!synEventData.id) {
                handler(synEventData.params);
                return;
            }
            Promise.resolve(handler(synEventData.params))
                .then((result) => {
                    const ackEventData: RPCSACKEvent = {
                        jsonrpc: '2.0',
                        result,
                        id: synEventData.id,
                    };
                    this._event.emit(ackEventName, ackEventData);
                })
                .catch((error) => {
                    const ackEventData: RPCSACKEvent = {
                        jsonrpc: '2.0',
                        id: synEventData.id,
                        error: {
                            code: error?.code || RPCCodes.APPLICATION_ERROR.code,
                            message: error?.message || RPCCodes.APPLICATION_ERROR.message,
                            data: null,
                        },
                    };
                    this._event.emit(ackEventName, ackEventData);
                });
        };
        this._event.on(synEventName, synEventHandler);
    }

    removeMethod(method: string) {
        if (!this._methods[method]) {
            delete this._methods[method];
        }
        const synEventName = this._getSynEventName(method);
        this._event.off(synEventName);
    }

    invoke(
        method: string,
        params: any,
        options: RPCInvokeOptions = { isNotify: false, timeout: 0 }
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const synEventName = this._getSynEventName(method);
            const synEventId = RPC.uuid();
            const synEventData: RPCSYNEvent = {
                jsonrpc: '2.0',
                method,
                params,
                id: synEventId,
            };
            this._event.emit(synEventName, synEventData);
            if (!options.isNotify) {
                const ackEventName = this._getAckEventName(method);
                const timeout = options.timeout || this._timeout;
                let timer: ReturnType<typeof setTimeout>;
                if (timeout) {
                    timer = setTimeout(() => {
                        const error: RPCError = {
                            ...RPCCodes.CONNECT_TIMEOUT,
                            data: { timeout },
                        };
                        reject(error);
                    }, timeout);
                }
                const ackEventHandler = (ackEventData: RPCSACKEvent) => {
                    if (ackEventData.id === synEventId) {
                        clearTimeout(timer);
                        this._event.off(ackEventName, ackEventHandler);
                        if (!ackEventData.error) {
                            resolve(ackEventData.result);
                        } else {
                            reject(ackEventData.error);
                        }
                    }
                };
                this._event.on(ackEventName, ackEventHandler);
            } else {
                // notify is not need ack
                resolve(undefined);
            }
        });
    }

    destroy(): void {
        Object.entries(this._methods).forEach(([method]) => {
            const synEventName = this._getSynEventName(method);
            this._event.off(synEventName);
        });
        const connectAckEventName = this._getAckEventName(RPC.EVENT.CONNECT);
        const connectSynEventName = this._getSynEventName(RPC.EVENT.CONNECT);
        this._event.off(connectSynEventName);
        this._event.off(connectAckEventName);
        if (this._event.destroy) {
            this._event.destroy();
        }
    }
}
