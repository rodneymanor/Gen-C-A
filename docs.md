# Claude AI Documentation Agent for React Apps

## Agent Overview

**Agent Name:** React Documentation Specialist  
**Agent Purpose:** Specialized AI sub-agent focused on creating comprehensive, organized documentation for React applications  
**Agent Type:** Documentation & Knowledge Management Specialist

## Core Capabilities

This agent specializes in analyzing React codebases and generating structured documentation that covers:

- **Component Architecture Documentation**
- **Application Flow & Order of Operations**
- **Modification Guidelines & Best Practices**
- **Developer Onboarding Documentation**
- **API Integration Documentation**
- **State Management Documentation**
- **Roadmap Synchronization** (keeps `/docs/ROADMAP.md` and the in-app `/roadmap` aligned)

## Quick Links

- Dev Guide: docs/DEVELOPMENT_GUIDE.md (includes admin brand voice meta controls and TikTok batching)
- Alpha Docs: docs/GEN_C_ALPHA_DOCUMENTATION.md (high-level features, brand voice admin summary)

## Agent Configuration

### System Prompt

```
You are a React Documentation Specialist, an expert AI agent focused exclusively on creating comprehensive, developer-friendly documentation for React applications.

Your primary responsibilities:
1. Analyze React codebases to understand architecture, patterns, and data flow
2. Generate clear, actionable documentation for developers
3. Create modification guides with step-by-step instructions
4. Document order of operations and dependencies
5. Provide onboarding documentation for new team members
6. Maintain documentation standards and consistency

Documentation Standards:
- Use clear, concise language suitable for developers of all skill levels
- Include code examples and practical implementation details
- Structure information hierarchically with proper headings
- Focus on "how" and "why" in addition to "what"
- Include troubleshooting sections for common issues
- Reference specific file paths and component names
- Create actionable next steps and modification guides

Output Format:
- Use Markdown formatting for all documentation
- Include table of contents for longer documents
- Use code blocks with syntax highlighting
- Include diagrams and flowcharts when beneficial
- Provide cross-references between related documentation sections
```

### Tool Permissions

Grant this agent access to:
- **File Reading/Analysis Tools** - To analyze React codebase structure
- **Documentation Generation Tools** - To create and format documentation
- **Roadmap Management** - To propose, append, and reorder items in `docs/ROADMAP.md`
- **Code Analysis Tools** - To understand component relationships and data flow
- **Diagram Creation Tools** - To create visual representations of architecture

### Agent Invocation

The agent can be invoked with commands like:
- "Use the React Documentation Specialist to document this component"
- "Generate modification guides for the authentication system"
- "Create onboarding documentation for the dashboard features"
- "Document the order of operations for the data fetching flow"

## Documentation Templates

### 1. Component Documentation Template

```markdown
# Component Name: [ComponentName]

## Overview
Brief description of component purpose and functionality.

## Props Interface
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prop1 | string | Yes | - | Description |
| prop2 | boolean | No | false | Description |

## Usage Example
```jsx
<ComponentName 
  prop1="value"
  prop2={true}
/>
```

## State Management
- Local state variables and their purposes
- Context usage (if applicable)
- External state management integration

## Side Effects
- useEffect hooks and their triggers
- API calls and data fetching
- Event listeners and cleanup

## Dependencies
- Required packages and versions
- Internal component dependencies
- External service dependencies

## Modification Guidelines
Step-by-step instructions for common modifications:
1. Adding new props
2. Modifying behavior
3. Styling changes
4. Testing requirements

## Related Components
Links to related components and their relationships.
```

### 2. Application Flow Documentation Template

```markdown
# Application Flow: [Feature Name]

## Overview
High-level description of the feature and its purpose.

## Order of Operations
1. **Initialization Phase**
   - Component mounting
   - Initial state setup
   - Required data fetching

2. **User Interaction Phase**
   - Event handling
   - State updates
   - Validation logic

3. **Data Processing Phase**
   - API calls
   - Data transformation
   - Error handling

4. **UI Update Phase**
   - Component re-rendering
   - State synchronization
   - User feedback

## File Structure
```
src/
├── components/
│   ├── FeatureComponent.jsx
│   └── SubComponent.jsx
├── hooks/
│   └── useFeatureHook.js
├── services/
│   └── featureAPI.js
└── utils/
    └── featureHelpers.js
```

## Key Components Involved
- **ComponentA**: Responsible for X
- **ComponentB**: Handles Y
- **ComponentC**: Manages Z

## Data Flow Diagram
[Include visual representation of data flow]

## Common Modification Scenarios
### Adding New Feature Step
1. Identify insertion point in flow
2. Create/modify relevant components
3. Update state management
4. Add error handling
5. Update tests

### Modifying Existing Behavior
1. Locate responsible component/hook
2. Understand current dependencies
3. Plan backward-compatible changes
4. Implement with proper testing
```

### 3. Modification Guide Template

```markdown
# Modification Guide: [Feature/Component]

## Prerequisites
- Understanding of React concepts required
- Familiarity with project structure
- Required tools and environment setup

## Common Modifications

### Adding New Props
**Difficulty: Easy**
1. Locate component file: `src/components/[ComponentName].jsx`
2. Add prop to interface/PropTypes
3. Implement prop usage in component
4. Update parent components passing new prop
5. Add documentation for new prop

**Files to modify:**
- `src/components/[ComponentName].jsx`
- `src/components/[ParentComponent].jsx` (if applicable)

### Modifying State Logic
**Difficulty: Medium**
1. Identify current state management approach
2. Plan state structure changes
3. Update useState/useReducer logic
4. Modify related useEffect hooks
5. Update component render logic
6. Test state transitions

**Files to modify:**
- Component file containing state
- Related custom hooks (if applicable)
- Child components receiving state props

### Adding API Integration
**Difficulty: Medium-Hard**
1. Create API service function in `src/services/`
2. Create custom hook for API interaction
3. Implement loading/error states
4. Add data transformation logic
5. Update component to use new data
6. Add error boundaries and fallbacks

**Files to modify:**
- `src/services/apiService.js`
- `src/hooks/useCustomHook.js`
- Component consuming the data

## Best Practices for Modifications
- Always maintain backward compatibility when possible
- Write tests for new functionality
- Update documentation after changes
- Consider performance implications
- Follow existing code patterns and conventions

## Testing Requirements
- Unit tests for new functions/components
- Integration tests for modified flows
- Visual regression tests for UI changes
- Performance tests for complex modifications

## Rollback Plan
Instructions for reverting changes if issues arise:
1. Git commit structure for easy rollback
2. Database migration rollback steps (if applicable)
3. Cache clearing requirements
4. Environment variable resets
```

### 4. Roadmap Update Template

```markdown
# Roadmap Update: [Feature/Area]

## Summary
One-paragraph description of the change.

## Timeframe
- Next up (1–2 weeks) | Near term (2–4 weeks) | Later (4–8 weeks)

## Rationale
Why this matters and expected impact.

## Tasks
- [ ] Task 1
- [ ] Task 2

## Links
- Related files, PRs, and docs
```

## Implementation Instructions

### Step 1: Create the Agent in Claude Code

1. Open Claude Code and run `/agents`
2. Select "Create New Agent"
3. Choose project-level or user-level based on your needs
4. Name the agent "React Documentation Specialist"
5. Copy the system prompt from this document
6. Configure tool permissions as specified
7. Save the agent

### Step 2: Prepare Your React App for Analysis

Before using the agent, ensure your React app structure includes:
- Clear component organization
- Consistent naming conventions
- Proper prop types or TypeScript interfaces
- Meaningful comments for complex logic

### Step 3: Initial Documentation Generation

Use the agent to create baseline documentation:
```
Use the React Documentation Specialist to analyze my entire React app and create:
1. Application architecture overview
2. Component hierarchy documentation
3. Main user flows documentation
4. Development setup guide
```

### Step 4: Ongoing Documentation Maintenance

Set up workflows for regular documentation updates:
- Use the agent during code reviews
- Generate documentation for new features
- Update modification guides when architecture changes
- Create troubleshooting guides as issues arise

## Agent Usage Examples

### Documenting a New Component
```
Use the React Documentation Specialist to document the UserProfileCard component. Include:
- Props interface and usage examples
- State management details
- Modification guidelines for common changes
- Integration with the user authentication system
```

### Creating Feature Flow Documentation
```
Use the React Documentation Specialist to document the entire checkout process flow, including:
- Order of operations from cart to payment
- All components involved
- API calls and data transformations
- Error handling and edge cases
- Modification guide for adding new payment methods
```

### Generating Onboarding Documentation
```
Use the React Documentation Specialist to create onboarding documentation for new developers joining our project. Include:
- Project structure overview
- Key concepts and patterns we use
- How to run and test the application
- Common development workflows
- Where to find specific types of code
```

## Expected Benefits

Using this specialized documentation agent will provide:

1. **Consistent Documentation Standards** - All documentation follows the same format and quality standards
2. **Reduced Onboarding Time** - New developers can quickly understand the codebase structure
3. **Faster Feature Development** - Clear modification guides accelerate development
4. **Better Code Maintainability** - Comprehensive documentation makes refactoring safer
5. **Knowledge Preservation** - Important architectural decisions and patterns are documented
6. **Improved Debugging** - Order of operations documentation helps trace issues

## Maintenance and Updates

To keep the agent effective:
- Regularly review and update documentation templates
- Gather feedback from team members using the documentation
- Update the agent's system prompt based on evolving project needs
- Expand tool permissions as new documentation requirements emerge
- Create specialized variants for different types of React projects (Next.js, Gatsby, etc.)

This agent will transform your React development workflow by ensuring that knowledge is captured, shared, and maintained systematically as your application grows and evolves.
