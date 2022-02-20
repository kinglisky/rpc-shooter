import { RPCEvent } from './event';

interface Handler {
  (...args: any[]): any;
}

interface RPCInitOptions {
  event: RPCEvent;
  methods?: Record<string, Handler>;
}

interface RPCSYNCEvent {
  jsonrpc: '2.0',
  method: string,
  params: any,
  id?: string,
}

interface RPCSACKEvent {
  jsonrpc: '2.0',
  result: any,
  error?: {
    code: number;
    message: string;
    data: any;
  },
  id?: string,
}

export class RPC {
  private _event: RPCEvent

  private _methods: Record<string, Handler> = {}

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
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

  registerMethod(method: string, handler: Handler) {
    if (this._methods[method]) {
      throw new Error(`${method} already registered`)
    }
    this._methods[method] = handler;
    const synEventName = this._getAckEventName(method);
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
    }
    this._event.on(synEventName, synEventHandler);
  }

  invoke(method: string, params: any, isNotify: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      const synEventName = this._getAckEventName(method);
      const synEventId = RPC.uuid();
      const synEventData: RPCSYNCEvent = {
        jsonrpc: '2.0',
        method,
        params,
        id: synEventId,
      }
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
}