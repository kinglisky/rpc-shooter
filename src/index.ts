interface RPCHandler {
  (...args: any[]): any;
}
interface RPCEvent {
  emit(event: string, ...args: any[]): void;
  on(event: string, fn: RPCHandler): void;
  off(event: string, fn?: RPCHandler): void;
  destroy?: () => void;
}

interface RPCEventData {
  event: string;
  args: any[];
}
interface RPCMessageEventOptions {
  currentContext: Window | Worker;
  targetContext: Window | Worker;
  origin?: string;
}
interface RPCInitOptions {
  event: RPCEvent;
  methods?: Record<string, RPCHandler>;
}

interface RPCSYNCEvent {
  jsonrpc: '2.0';
  method: string;
  params: any;
  id?: string;
}

interface RPCSACKEvent {
  jsonrpc: '2.0';
  result: any;
  error?: {
    code: number;
    message: string;
    data: any;
  };
  id?: string;
}

export class RPCMessageEvent implements RPCEvent {
  private _currentContext: Window | Worker;
  private _targetContextContext: Window | Worker;
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
    if (globalThis.constructor.name === 'DedicatedWorkerGlobalScope') {
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

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  constructor(options: RPCInitOptions) {
    this._event = options.event;
    if (options.methods) {
      Object.entries(options.methods).forEach(([method, handler]) => {
        this.registerMethod(method, handler);
      });
    }
  }

  _getSynEventName(method: string): string {
    return `syn:${method}`;
  }

  _getAckEventName(method: string): string {
    return `ack:${method}`;
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

  destroy(): void {}
}
