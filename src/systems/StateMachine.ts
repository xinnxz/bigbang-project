// ==================================================================================
// STATE MACHINE - Engine State Management
// ==================================================================================

import { EngineState } from '../types';

type StateChangeCallback = (newState: EngineState, prevState: EngineState) => void;

export class StateMachine {
    private currentState: EngineState = EngineState.VOID;
    private listeners: StateChangeCallback[] = [];

    public get state(): EngineState {
        return this.currentState;
    }

    public setState(newState: EngineState): void {
        if (this.currentState === newState) return;

        const prevState = this.currentState;
        this.currentState = newState;

        this.listeners.forEach(callback => callback(newState, prevState));
    }

    public onStateChange(callback: StateChangeCallback): () => void {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) this.listeners.splice(index, 1);
        };
    }

    public isState(state: EngineState): boolean {
        return this.currentState === state;
    }
}
