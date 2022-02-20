export interface RPCEvent {
    emit(event: string, ...args: any[]): void;
    on(event: string, fn: (...args: any[]) => any): void;
    off(event: string, fn?: (...args: any[]) => any): void;
}
