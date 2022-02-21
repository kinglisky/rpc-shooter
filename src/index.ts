export interface RPCHandler {
    (...args: any[]): any;
}
export interface RPCEvent {
    emit(event: string, ...args: any[]): void;
    on(event: string, fn: RPCHandler): void;
    off(event: string, fn?: RPCHandler): void;
    destroy?: () => void;
}

export interface RPCEventData {
    event: string;
    args: any[];
}
export interface RPCMessageEventOptions {
    currentContext: Window | Worker | MessagePort;
    targetContext: Window | Worker | MessagePort;
    origin?: string;
}
export interface RPCInitOptions {
    event: RPCEvent;
    methods?: Record<string, RPCHandler>;
    timeout?: number;
}

export interface RPCSYNCEvent {
    jsonrpc: '2.0';
    method: string;
    params: any;
    id?: string;
}

export interface RPCError {
    code: number;
    message: string;
    data: any;
}
export interface RPCSACKEvent {
    jsonrpc: '2.0';
    result: any;
    error?: RPCError;
    id?: string;
}

export class RPCMessageEvent implements RPCEvent {
    static WorkerConstructorNames: Array<string> = [
        'DedicatedWorkerGlobalScope',
        'SharedWorkerGlobalScope',
        'Worker',
        'SharedWorker',
        'MessagePort',
    ];
    private _currentContext: Window | Worker | MessagePort;
    private _targetContextContext: Window | Worker | MessagePort;
    private _origin: string;
    private _events: Record<string, Array<RPCHandler>>;
    private _receiveMessage: (event: MessageEvent) => void;

    constructor(options: RPCMessageEventOptions) {
        this._events = {};
        this._currentContext = options.currentContext;
        this._targetContextContext = options.targetContext;
        this._origin = options.origin || '';
        const receiveMessage = (event: MessageEvent) => {
            const data = event.data as RPCEventData;
            if (typeof data.event === 'string') {
                const eventHandlers = this._events[data.event] || [];
                if (eventHandlers.length) {
                    eventHandlers.forEach((handler) => {
                        handler(...data.args);
                    });
                }
            }
        };
        this._currentContext.addEventListener(
            'message',
            receiveMessage as EventListenerOrEventListenerObject,
            false
        );
        this._receiveMessage = receiveMessage;
    }

    emit(event: string, ...args: any[]): void {
        const data = {
            event,
            args,
        };
        // in worker
        if (
            RPCMessageEvent.WorkerConstructorNames.includes(
                this._targetContextContext.constructor.name
            )
        ) {
            this._targetContextContext.postMessage(data);
            return;
        }
        (this._targetContextContext as Window).postMessage(data, this._origin);
    }

    on(event: string, fn: RPCHandler): void {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(fn);
    }

    off(event: string, fn?: RPCHandler): void {
        if (!fn) {
            this._events[event] = [];
            return;
        }
        const handlers = this._events[event] || [];
        this._events[event] = handlers.filter((handler) => handler !== fn);
    }

    destroy(): void {
        this._currentContext.removeEventListener(
            'message',
            this._receiveMessage as EventListenerOrEventListenerObject,
            false
        );
    }
}

export class RPC {
    private _event: RPCEvent;

    private _methods: Record<string, RPCHandler> = {};

    private _timeout: number = 0;

    private _$connect: Promise<void> | null = null;

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
        this.connect();
    }

    _getSynEventName(method: string): string {
        return `syn:${method}`;
    }

    _getAckEventName(method: string): string {
        return `ack:${method}`;
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
                        code: 32300,
                        message: 'connect timeout',
                        data: { timeout: connectTimeout },
                    };
                    reject(error);
                }, connectTimeout);
            }
            const connectEventName = '__rpc_connect_event';
            const connectAckEventName = this._getAckEventName(connectEventName);
            const connectSynEventName = this._getSynEventName(connectEventName);
            const resolveConnectEvent = () => {
                clearTimeout(connectTimer);
                this._event.off(connectSynEventName);
                this._event.off(connectAckEventName);
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
        const synEventHandler = (synEventData: RPCSYNCEvent) => {
            Promise.resolve(handler(synEventData.params)).then((result) => {
                const ackEventName = this._getAckEventName(method);
                const ackEventData: RPCSACKEvent = {
                    jsonrpc: '2.0',
                    result,
                    id: synEventData.id,
                };
                this._event.emit(ackEventName, ackEventData);
                this._event.off(synEventName, synEventHandler);
            });
        };
        this._event.on(synEventName, synEventHandler);
    }

    invoke(method: string, params: any, isNotify: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const synEventName = this._getSynEventName(method);
            const synEventId = RPC.uuid();
            const synEventData: RPCSYNCEvent = {
                jsonrpc: '2.0',
                method,
                params,
                id: synEventId,
            };
            this._event.emit(synEventName, synEventData);
            if (!isNotify) {
                const ackEventName = this._getAckEventName(method);
                const ackEventHandler = (ackEventData: RPCSACKEvent) => {
                    if (ackEventData.id === synEventId) {
                        this._event.off(ackEventName, ackEventHandler);
                        if (!ackEventData.error) {
                            resolve(ackEventData.result);
                        } else {
                            reject(ackEventData.error);
                        }
                    }
                };
                this._event.on(ackEventName, ackEventHandler);
            }
        });
    }

    destroy(): void {
        Object.entries(this._methods).forEach(([method]) => {
            const synEventName = this._getSynEventName(method);
            this._event.off(synEventName);
        });
        if (this._event.destroy) {
            this._event.destroy();
        }
    }
}
