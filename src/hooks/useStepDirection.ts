import { useState } from "react";

/** 1 when `index` last moved forward, -1 when it moved back. Derived during render, no effect needed. */
export function useStepDirection(index: number): 1 | -1 {
    const [state, setState] = useState<{ index: number; direction: 1 | -1 }>({ index, direction: 1 });
    if (state.index !== index) {
        const direction = index > state.index ? 1 : -1;
        setState({ index, direction });
        return direction;
    }
    return state.direction;
}
