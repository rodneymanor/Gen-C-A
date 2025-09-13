/**
 * React Debug Sub-Agent 🔍
 * Expert React Debugging Assistant for systematic debugging and root cause analysis
 */

export enum DEBUG_LEVELS {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

interface LogEntry {
  id: string;
  timestamp: string;
  component: string;
  level: string;
  message: string;
  data: any;
  stack: string;
}

interface ReactDebuggerOptions {
  level?: DEBUG_LEVELS;
  enableTerminalOutput?: boolean;
  enableConsoleGrouping?: boolean;
}

export class ReactDebugger {
  private componentName: string;
  private level: DEBUG_LEVELS;
  private logCount: number;
  private enableTerminalOutput: boolean;
  private enableConsoleGrouping: boolean;

  constructor(
    componentName: string,
    options: ReactDebuggerOptions = {}
  ) {
    this.componentName = componentName;
    this.level = options.level ?? DEBUG_LEVELS.DEBUG;
    this.logCount = 0;
    this.enableTerminalOutput = options.enableTerminalOutput ?? true;
    this.enableConsoleGrouping = options.enableConsoleGrouping ?? true;
  }

  private log(level: DEBUG_LEVELS, message: string, data: any = {}): LogEntry {
    if (level > this.level) {
      return {} as LogEntry;
    }

    const timestamp = new Date().toISOString();
    const logId = `${this.componentName}-${++this.logCount}`;

    const logEntry: LogEntry = {
      id: logId,
      timestamp,
      component: this.componentName,
      level: DEBUG_LEVELS[level],
      message,
      data,
      stack: new Error().stack || ''
    };

    // Console output with styling
    const styles = [
      'color: white; background: #2196F3; padding: 2px 4px; border-radius: 2px;',
      'color: #666;',
      'color: #000; font-weight: bold;'
    ];

    if (this.enableConsoleGrouping) {
      console.group(
        `%c${this.componentName}%c ${timestamp} %c${message}`,
        ...styles
      );
      console.log('Data:', data);
      if (level <= DEBUG_LEVELS.WARN) {
        console.log('Stack trace:', logEntry.stack);
      }
      console.groupEnd();
    } else {
      console.log(
        `%c${this.componentName}%c ${timestamp} %c${message}`,
        ...styles,
        data
      );
    }

    // Send to terminal if in development
    if (process.env.NODE_ENV === 'development' && this.enableTerminalOutput) {
      this.sendToTerminal(logEntry);
    }

    return logEntry;
  }

  private sendToTerminal(logEntry: LogEntry): void {
    // If using a dev server, this sends logs to terminal
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log(`[DEBUG] ${JSON.stringify(logEntry, null, 2)}`);
    }
  }

  // Public logging methods
  trace(message: string, data?: any): LogEntry {
    return this.log(DEBUG_LEVELS.TRACE, message, data);
  }

  debug(message: string, data?: any): LogEntry {
    return this.log(DEBUG_LEVELS.DEBUG, message, data);
  }

  info(message: string, data?: any): LogEntry {
    return this.log(DEBUG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: any): LogEntry {
    return this.log(DEBUG_LEVELS.WARN, message, data);
  }

  error(message: string, data?: any): LogEntry {
    return this.log(DEBUG_LEVELS.ERROR, message, data);
  }

  // Component lifecycle helpers
  logMount(props?: any, state?: any): void {
    this.info('Component mounted', { props, state });
  }

  logUnmount(): void {
    this.info('Component unmounting');
  }

  logStateChange(newState: any, oldState?: any): void {
    this.debug('State changed', {
      newState,
      oldState,
      timestamp: Date.now(),
      diff: this.calculateStateDiff(oldState, newState)
    });
  }

  logPropsChange(newProps: any, oldProps?: any): void {
    this.debug('Props changed', {
      newProps,
      oldProps,
      diff: this.calculateStateDiff(oldProps, newProps)
    });
  }

  logRender(renderCount?: number, props?: any, state?: any): void {
    this.trace('Render cycle', {
      renderCount,
      props,
      state,
      timestamp: Date.now()
    });
  }

  logFunctionCall(functionName: string, args?: any[], context?: any): void {
    this.trace(`${functionName} called`, {
      args,
      context,
      timestamp: Date.now()
    });
  }

  logError(error: Error, context?: any): void {
    this.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }

  // Helper methods
  private calculateStateDiff(oldValue: any, newValue: any): any {
    if (!oldValue || !newValue) return null;

    try {
      const oldStr = JSON.stringify(oldValue);
      const newStr = JSON.stringify(newValue);
      return {
        changed: oldStr !== newStr,
        oldValue,
        newValue
      };
    } catch {
      return { changed: true, note: 'Could not serialize for comparison' };
    }
  }

  // Performance monitoring
  startTimer(label: string): void {
    console.time(`${this.componentName}-${label}`);
  }

  endTimer(label: string): void {
    console.timeEnd(`${this.componentName}-${label}`);
  }

  // Group related logs
  startGroup(label: string): void {
    console.group(`${this.componentName}: ${label}`);
  }

  endGroup(): void {
    console.groupEnd();
  }
}

// Hook for easy React component integration
export function useDebugger(componentName: string, options?: ReactDebuggerOptions) {
  const debuggerRef = React.useRef<ReactDebugger>();

  if (!debuggerRef.current) {
    debuggerRef.current = new ReactDebugger(componentName, options);
  }

  return debuggerRef.current;
}

// HOC for automatic component debugging
export function withDebugger<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  debuggerOptions?: ReactDebuggerOptions
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithDebuggerComponent = (props: P) => {
    const debugger = useDebugger(displayName, debuggerOptions);
    const renderCount = React.useRef(0);

    // Log mount/unmount
    React.useEffect(() => {
      debugger.logMount(props);
      return () => debugger.logUnmount();
    }, []);

    // Log renders
    React.useEffect(() => {
      debugger.logRender(++renderCount.current, props);
    });

    return React.createElement(WrappedComponent, props);
  };

  WithDebuggerComponent.displayName = `withDebugger(${displayName})`;
  return WithDebuggerComponent;
}

export default ReactDebugger;