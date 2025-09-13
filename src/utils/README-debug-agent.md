# React Debug Sub-Agent 🔍

## Overview

The React Debug Sub-Agent is a comprehensive debugging system designed to help identify and resolve issues in React applications through systematic logging, performance monitoring, and root cause analysis.

## Features

- **Comprehensive Logging**: Multi-level logging with timestamps and stack traces
- **Component Lifecycle Tracking**: Automatic mount/unmount and render cycle logging
- **State Management Debugging**: Track state changes with diff analysis
- **Performance Monitoring**: Built-in timing and performance measurement tools
- **Error Handling**: Structured error logging with context
- **API Request Debugging**: Request/response interceptor with detailed logging
- **React Hooks Integration**: Easy-to-use hooks for component debugging
- **HOC Support**: Higher-order component for automatic debugging

## Installation

The debug utilities are already installed in your project at:
- `src/utils/debugger.ts` - Main debugger class
- `src/utils/debug-examples.tsx` - Integration examples

## Quick Start

### Basic Usage

```typescript
import { useDebugger } from '../utils/debugger';

const MyComponent = () => {
  const debug = useDebugger('MyComponent');
  const [count, setCount] = useState(0);

  // Log component lifecycle
  useEffect(() => {
    debug.logMount({ count });
    return () => debug.logUnmount();
  }, []);

  // Log state changes
  useEffect(() => {
    debug.logStateChange({ count });
  }, [count]);

  const handleClick = () => {
    debug.logFunctionCall('handleClick', [count]);
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
};
```

### Using the HOC

```typescript
import { withDebugger } from '../utils/debugger';

const MyComponent = ({ title }) => (
  <div>{title}</div>
);

export default withDebugger(MyComponent);
```

## API Reference

### ReactDebugger Class

#### Constructor
```typescript
new ReactDebugger(componentName: string, options?: ReactDebuggerOptions)
```

#### Logging Methods
- `trace(message, data?)` - Detailed trace information
- `debug(message, data?)` - Debug information
- `info(message, data?)` - General information
- `warn(message, data?)` - Warning messages
- `error(message, data?)` - Error messages

#### Lifecycle Methods
- `logMount(props?, state?)` - Log component mount
- `logUnmount()` - Log component unmount
- `logStateChange(newState, oldState?)` - Log state changes
- `logPropsChange(newProps, oldProps?)` - Log prop changes
- `logRender(renderCount?, props?, state?)` - Log render cycles

#### Function Tracking
- `logFunctionCall(functionName, args?, context?)` - Log function calls
- `logError(error, context?)` - Log errors with context

#### Performance Monitoring
- `startTimer(label)` - Start performance timer
- `endTimer(label)` - End performance timer
- `startGroup(label)` - Start console group
- `endGroup()` - End console group

### Hooks

#### useDebugger
```typescript
const debug = useDebugger(componentName: string, options?: ReactDebuggerOptions);
```

#### useDebuggedCounter (Example Custom Hook)
```typescript
const { count, increment, decrement, reset } = useDebuggedCounter(initialValue?);
```

### HOC

#### withDebugger
```typescript
const DebuggedComponent = withDebugger(Component, options?);
```

## Configuration

### Debug Levels
```typescript
enum DEBUG_LEVELS {
  ERROR = 0,   // Only errors
  WARN = 1,    // Warnings and errors
  INFO = 2,    // Info, warnings, and errors
  DEBUG = 3,   // Debug info and above
  TRACE = 4    // All logging including traces
}
```

### Options
```typescript
interface ReactDebuggerOptions {
  level?: DEBUG_LEVELS;
  enableTerminalOutput?: boolean;
  enableConsoleGrouping?: boolean;
}
```

## Common Use Cases

### 1. Debugging State Issues

```typescript
const MyComponent = () => {
  const debug = useDebugger('MyComponent');
  const [data, setData] = useState(null);

  useEffect(() => {
    debug.logStateChange({ data }, { data: 'previous' });
  }, [data]);

  const updateData = (newData) => {
    debug.logFunctionCall('updateData', [newData]);
    debug.startTimer('data-update');

    setData(newData);

    debug.endTimer('data-update');
    debug.info('Data updated successfully', { newData });
  };
};
```

### 2. API Debugging

```typescript
import { apiDebugger } from '../utils/debug-examples';

const fetchUserData = async (userId) => {
  try {
    const userData = await apiDebugger.fetchData(`/api/users/${userId}`);
    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};
```

### 3. Performance Monitoring

```typescript
const ExpensiveComponent = () => {
  const debug = useDebugger('ExpensiveComponent');

  const expensiveOperation = useCallback(() => {
    debug.startTimer('expensive-operation');

    // Your expensive code here
    const result = performCalculation();

    debug.endTimer('expensive-operation');
    return result;
  }, []);
};
```

### 4. Error Boundary Debugging

```typescript
import { DebuggedErrorBoundary } from '../utils/debug-examples';

const App = () => (
  <DebuggedErrorBoundary>
    <MyComponent />
  </DebuggedErrorBoundary>
);
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. State Not Updating
```typescript
// ❌ Wrong - mutating state
setState(state.items.push(newItem));

// ✅ Correct - immutable update
setState(prev => [...prev.items, newItem]);
```

#### 2. useEffect Running Infinitely
```typescript
// ❌ Wrong - missing dependencies
useEffect(() => {
  fetchData();
});

// ✅ Correct - proper dependencies
useEffect(() => {
  fetchData();
}, [fetchData]);
```

#### 3. Event Handler Issues
```typescript
// ❌ Wrong - calling function immediately
<button onClick={handleClick()}>

// ✅ Correct - passing function reference
<button onClick={handleClick}>
```

### Debug Log Analysis

#### Console Output Format
```
🔍 ComponentName 2024-01-01T12:00:00.000Z Function called
├── Data: { args: [...], context: {...} }
├── Stack: Error stack trace
└── Performance: 15.2ms
```

#### Terminal Output (Development)
```bash
[DEBUG] {
  "id": "ComponentName-1",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "component": "ComponentName",
  "level": "INFO",
  "message": "Component mounted",
  "data": { "props": {...}, "state": {...} }
}
```

## Best Practices

### 1. Strategic Debugging
- Use appropriate log levels (TRACE for detailed debugging, INFO for general flow)
- Add debugging to problematic components first
- Use performance timers for expensive operations

### 2. Clean Up
- Remove or reduce debug level in production
- Use environment variables to control debugging
- Group related logs for better organization

### 3. Context Information
- Always provide relevant context with logs
- Include current state/props when logging errors
- Use meaningful component and function names

## Integration with Existing Code

### Adding to Existing Components
1. Import the debugger hook: `import { useDebugger } from '../utils/debugger';`
2. Initialize in component: `const debug = useDebugger('ComponentName');`
3. Add lifecycle logging in useEffect
4. Add function call logging to event handlers
5. Add state change logging

### Gradual Adoption
Start with problematic components and gradually add debugging to related components. Use the HOC for quick debugging of simple components.

## Environment Configuration

### Development Only
```typescript
const debug = useDebugger('MyComponent', {
  level: process.env.NODE_ENV === 'development' ? DEBUG_LEVELS.DEBUG : DEBUG_LEVELS.ERROR
});
```

### Production Considerations
- Set debug level to ERROR or WARN in production
- Disable terminal output in production
- Consider using a logging service for production error tracking

## Examples in the Codebase

Check `src/utils/debug-examples.tsx` for comprehensive examples including:
- Basic component debugging
- HOC usage
- API debugging
- State management debugging
- Performance monitoring
- Error boundaries
- Custom hooks

## Getting Help

When reporting issues with the debug agent:

1. **Provide Debug Logs**: Include the console output from the debugger
2. **Component Code**: Share the component code with debugging added
3. **Expected vs Actual**: Describe what should happen vs what happens
4. **Environment**: Include browser, React version, and any error messages
5. **Reproduction Steps**: Steps to reproduce the issue

## Example Bug Report Template

```markdown
## Issue Description
[Describe the problem]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Debug Logs
```
[Paste debug output here]
```

## Component Code
```typescript
[Relevant component code]
```

## Environment
- React Version: 18.x
- Browser: Chrome/Firefox/Safari
- Error Messages: [Any console errors]
```

This debugging system will help you identify and resolve React issues systematically. Happy debugging! 🔍