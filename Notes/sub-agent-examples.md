# Sub-Agent Usage Examples

The Sub-Agent is an AI-powered tool that reads Product Requirements Documents (PRDs) and automatically implements corresponding application pages using your existing codebase patterns.

## Prerequisites

1. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

2. Ensure you're in the project root directory with a valid React/TypeScript project.

## Quick Start

### 1. Initialize the Sub-Agent

```bash
npm run sub-agent init
```

This will:
- Scan your codebase for existing patterns
- Set up file watching
- Prepare the AI models for code generation

### 2. Analyze a PRD Document

```bash
npm run sub-agent analyze -f path/to/your/requirements.pdf -o implementation-plan.json
```

Supported formats:
- PDF documents (`.pdf`)
- Word documents (`.docx`)
- Markdown files (`.md`)
- Text files (`.txt`)

Example output:
```
📋 Analyzing PRD: requirements.pdf
📊 Extracted 12 requirements
📈 Generated implementation plan with 15 steps

📋 Requirements Summary:
  • User Dashboard (page) - Priority: high
  • User Profile Form (component) - Priority: medium
  • Authentication Service (service) - Priority: high
  • Navigation Routes (route) - Priority: high

🔄 Implementation Order:
  1. Authentication Service
  2. User Dashboard
  3. Navigation Routes
  4. User Profile Form
```

### 3. Implement Requirements

#### Implement all requirements:
```bash
npm run sub-agent implement -p implementation-plan.json
```

#### Implement a specific requirement:
```bash
npm run sub-agent implement -p implementation-plan.json -r user-dashboard-001
```

#### Dry run (see what would be implemented):
```bash
npm run sub-agent implement -p implementation-plan.json --dry-run
```

### 4. Watch Mode (Development)

```bash
npm run sub-agent watch
```

This starts the file watcher that:
- Monitors code changes in real-time
- Updates the codebase analysis automatically
- Provides suggestions for improvements

### 5. Validate Implementation

```bash
npm run sub-agent validate -p src/pages/
```

This checks:
- TypeScript compilation
- ESLint rules
- Component integration
- Route configuration

### 6. Check Status

```bash
npm run sub-agent status
```

Shows:
- Project configuration
- Environment setup
- Codebase analysis summary

## Example PRD Content

Here's an example of how to structure your PRD for optimal results:

```markdown
# User Management System Requirements

## Overview
Build a comprehensive user management system with authentication, profiles, and role-based access.

## Requirements

### 1. User Dashboard (High Priority)
- Display user statistics and recent activity
- Show personalized content based on user role
- Include navigation to other sections
- Requires authentication
- Accessible to: Admin, Manager, User

### 2. User Profile Management (Medium Priority)
- Allow users to edit their profile information
- Upload profile pictures
- Change password functionality
- Requires authentication
- Accessible to: All authenticated users

### 3. User Directory (Medium Priority)
- List all users in the system
- Filter by role, department, status
- Search functionality
- Export user data
- Requires authentication
- Accessible to: Admin, Manager

### 4. Authentication System (High Priority)
- Login/logout functionality
- Password reset
- Session management
- JWT token handling
- Role-based access control
```

## Advanced Features

### Custom Templates

The sub-agent uses your existing code patterns as templates. It will:

1. **Analyze existing components** to understand your:
   - Component structure and naming conventions
   - State management patterns
   - Styling approaches (Emotion, CSS modules, etc.)
   - Authentication patterns

2. **Identify service patterns** for:
   - API integration methods
   - Error handling approaches
   - Data transformation patterns
   - Firebase/Firestore usage

3. **Follow routing conventions** based on:
   - React Router configuration
   - Route protection patterns
   - Navigation structures

### Code Generation Quality

The sub-agent generates code that:
- ✅ Uses TypeScript with proper type definitions
- ✅ Follows your existing ESLint configuration
- ✅ Implements proper error boundaries
- ✅ Includes loading states and error handling
- ✅ Uses your established design system (Atlaskit)
- ✅ Follows authentication patterns from your codebase
- ✅ Maintains consistent file structure

### Integration with Existing Systems

The sub-agent automatically:
- **Discovers existing services** and reuses them when appropriate
- **Maps API endpoints** to existing backend integrations
- **Preserves authentication flows** that are already implemented
- **Maintains design consistency** with your component library

## Best Practices

### 1. PRD Writing Tips

- Be specific about user roles and permissions
- Include detailed descriptions of functionality
- Specify priority levels (high, medium, low)
- Mention any specific UI/UX requirements
- Include API endpoints if known

### 2. Implementation Tips

- Review generated code before committing
- Run tests after implementation
- Validate routing and navigation
- Check authentication flows
- Ensure responsive design works correctly

### 3. Maintenance

- Keep your codebase patterns consistent
- Update the sub-agent configuration as your project evolves
- Regular validation runs help catch issues early

## Troubleshooting

### Common Issues

1. **Missing OpenAI API Key**
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```

2. **TypeScript Compilation Errors**
   - Run `npm run type-check` to identify issues
   - Check generated code for any syntax problems

3. **Route Conflicts**
   - Review existing routes before implementation
   - Use the `--dry-run` flag to preview changes

4. **Authentication Issues**
   - Ensure your existing auth patterns are properly implemented
   - Check that protected routes are configured correctly

### Getting Help

1. Check the implementation plan for dependency issues
2. Review generated code for any obvious problems
3. Use validation tools to catch integration issues
4. Refer to your existing codebase patterns for guidance

## Integration with Development Workflow

### Pre-commit Hooks

Add validation to your pre-commit workflow:

```json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run lint && npm run sub-agent validate"
  }
}
```

### CI/CD Pipeline

Include sub-agent validation in your CI pipeline:

```yaml
- name: Validate Sub-Agent Implementation
  run: npm run sub-agent validate
```

This ensures that any generated code meets your quality standards before deployment.