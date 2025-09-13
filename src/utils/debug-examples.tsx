/**
 * React Debug Sub-Agent Integration Examples
 * Demonstrates how to use the debugging utilities in various scenarios
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactDebugger, useDebugger, withDebugger, DEBUG_LEVELS } from './debugger';

// Example 1: Basic component debugging with hooks
export const DebuggedComponent: React.FC = () => {
  const debug = useDebugger('DebuggedComponent');
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // Log component lifecycle
  useEffect(() => {
    debug.logMount({ count, text });
    return () => debug.logUnmount();
  }, []);

  // Log state changes
  useEffect(() => {
    debug.logStateChange({ count, text });
  }, [count, text]);

  // Debug function calls
  const handleIncrement = useCallback(() => {
    debug.logFunctionCall('handleIncrement', [count]);
    debug.startTimer('increment-operation');

    try {
      setCount(prev => prev + 1);
      debug.info('Count incremented successfully', { newCount: count + 1 });
    } catch (error) {
      debug.logError(error as Error, { operation: 'increment', currentCount: count });
    } finally {
      debug.endTimer('increment-operation');
    }
  }, [count, debug]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debug.logFunctionCall('handleTextChange', [e.target.value]);
    setText(e.target.value);
  }, [debug]);

  // Log render cycles
  const renderCount = useRef(0);
  debug.logRender(++renderCount.current, { count, text }, { count, text });

  return (
    <div>
      <h2>Debugged Component</h2>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="Type something..."
      />
    </div>
  );
};

// Example 2: HOC debugging
const SimpleComponent: React.FC<{ title: string }> = ({ title }) => {
  const [visible, setVisible] = useState(true);

  return (
    <div>
      <h3>{title}</h3>
      <button onClick={() => setVisible(!visible)}>
        {visible ? 'Hide' : 'Show'}
      </button>
      {visible && <p>This content can be toggled</p>}
    </div>
  );
};

export const DebuggedWithHOC = withDebugger(SimpleComponent, {
  level: DEBUG_LEVELS.INFO,
  enableConsoleGrouping: true
});

// Example 3: API debugging with interceptors
class ApiDebugger {
  private debug: ReactDebugger;

  constructor() {
    this.debug = new ReactDebugger('API', { level: DEBUG_LEVELS.DEBUG });
  }

  async fetchData(url: string, options?: RequestInit): Promise<any> {
    this.debug.logFunctionCall('fetchData', [url, options]);
    this.debug.startTimer(`fetch-${url}`);

    try {
      this.debug.info('Request initiated', {
        url,
        method: options?.method || 'GET',
        headers: options?.headers,
        body: options?.body
      });

      const response = await fetch(url, options);

      this.debug.info('Response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.debug.info('Data parsed successfully', { data });

      return data;
    } catch (error) {
      this.debug.logError(error as Error, {
        url,
        operation: 'fetch',
        options
      });
      throw error;
    } finally {
      this.debug.endTimer(`fetch-${url}`);
    }
  }
}

// Example 4: State management debugging (Context API)
interface AppState {
  user: { id: string; name: string } | null;
  theme: 'light' | 'dark';
  loading: boolean;
}

const initialState: AppState = {
  user: null,
  theme: 'light',
  loading: false
};

const AppContext = React.createContext<{
  state: AppState;
  setState: (newState: Partial<AppState>) => void;
}>({
  state: initialState,
  setState: () => {}
});

export const DebuggedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const debug = useDebugger('AppProvider');
  const [state, setStateInternal] = useState<AppState>(initialState);

  const setState = useCallback((newState: Partial<AppState>) => {
    debug.logFunctionCall('setState', [newState]);

    const oldState = { ...state };
    const updatedState = { ...state, ...newState };

    debug.logStateChange(updatedState, oldState);
    setStateInternal(updatedState);
  }, [state, debug]);

  useEffect(() => {
    debug.logMount(undefined, state);
    return () => debug.logUnmount();
  }, []);

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};

// Example 5: Performance debugging component
export const PerformanceDebuggedComponent: React.FC = () => {
  const debug = useDebugger('PerformanceComponent', { level: DEBUG_LEVELS.TRACE });
  const [items, setItems] = useState<number[]>([]);
  const expensiveValueRef = useRef<number>(0);

  // Expensive calculation with debugging
  const expensiveCalculation = useCallback((nums: number[]) => {
    debug.startTimer('expensive-calculation');
    debug.trace('Starting expensive calculation', { inputSize: nums.length });

    // Simulate expensive operation
    let result = 0;
    for (let i = 0; i < nums.length; i++) {
      for (let j = 0; j < 1000; j++) {
        result += nums[i] * j;
      }
    }

    debug.endTimer('expensive-calculation');
    debug.trace('Expensive calculation completed', { result, inputSize: nums.length });

    return result;
  }, [debug]);

  const addItem = useCallback(() => {
    debug.logFunctionCall('addItem');
    const newItem = Math.floor(Math.random() * 100);
    const newItems = [...items, newItem];

    debug.info('Adding new item', { newItem, totalItems: newItems.length });
    setItems(newItems);

    // Trigger expensive calculation
    expensiveValueRef.current = expensiveCalculation(newItems);
  }, [items, expensiveCalculation, debug]);

  const clearItems = useCallback(() => {
    debug.logFunctionCall('clearItems');
    debug.info('Clearing all items', { currentCount: items.length });
    setItems([]);
    expensiveValueRef.current = 0;
  }, [items, debug]);

  return (
    <div>
      <h2>Performance Debugged Component</h2>
      <p>Items count: {items.length}</p>
      <p>Expensive value: {expensiveValueRef.current}</p>
      <button onClick={addItem}>Add Item</button>
      <button onClick={clearItems}>Clear Items</button>
      <div>
        {items.map((item, index) => (
          <span key={index} style={{ margin: '2px', padding: '2px', background: '#f0f0f0' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// Example 6: Error boundary with debugging
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class DebuggedErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  private debug: ReactDebugger;

  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.debug = new ReactDebugger('ErrorBoundary');
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.debug.error('Error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'DebuggedErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      this.debug.warn('Rendering error fallback UI', { error: this.state.error });

      return (
        <div style={{ padding: '20px', border: '1px solid red', borderRadius: '4px' }}>
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => {
            this.debug.info('Resetting error boundary');
            this.setState({ hasError: false, error: undefined });
          }}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Example 7: Custom hook with debugging
export function useDebuggedCounter(initialValue: number = 0) {
  const debug = useDebugger('useCounter');
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    debug.logMount({ initialValue });
  }, []);

  const increment = useCallback(() => {
    debug.logFunctionCall('increment', [count]);
    setCount(prev => {
      const newValue = prev + 1;
      debug.debug('Counter incremented', { from: prev, to: newValue });
      return newValue;
    });
  }, [count, debug]);

  const decrement = useCallback(() => {
    debug.logFunctionCall('decrement', [count]);
    setCount(prev => {
      const newValue = prev - 1;
      debug.debug('Counter decremented', { from: prev, to: newValue });
      return newValue;
    });
  }, [count, debug]);

  const reset = useCallback(() => {
    debug.logFunctionCall('reset', [count, initialValue]);
    debug.info('Counter reset', { from: count, to: initialValue });
    setCount(initialValue);
  }, [count, initialValue, debug]);

  return { count, increment, decrement, reset };
}

// Export the API debugger instance for use across the app
export const apiDebugger = new ApiDebugger();