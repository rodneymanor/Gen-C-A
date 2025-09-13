# File Structure Update Tracker

*Auto-generated tracking system for Gen C Alpha file structure changes*

## Update Protocol

### When to Update the Memory Bank

1. **New files/directories created**
2. **Files/directories moved or renamed** 
3. **Major architectural changes**
4. **New feature modules added**
5. **Significant refactoring**

### Update Process

1. Run structure analysis command:
```bash
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" | grep -E "^\./(src|public|\.|README|package)" | sort
```

2. Compare with current memory bank diagram
3. Update `.claude/memory-bank/file-structure-diagram.md`
4. Add entry to Change Log section
5. Update Architecture Summary if needed

### Quick Commands

```bash
# Count current files by category
echo "React Components: $(find src/ -name "*.tsx" | wc -l)"
echo "TypeScript Files: $(find src/ -name "*.ts" | wc -l)"  
echo "Test Files: $(find __tests__ src/ -name "*.test.*" 2>/dev/null | wc -l)"
echo "Config Files: $(find . -maxdepth 1 -name "*.json" -o -name "*.config.*" -o -name "*.js" | wc -l)"

# Check for new directories
find src/ -type d | sort

# Check for recent file additions
find . -name "*.ts" -o -name "*.tsx" -mtime -1 | head -10
```

## Auto-Update Triggers

The memory bank should be updated when:
- [ ] New component directories are added
- [ ] New service modules are created  
- [ ] API routes are modified
- [ ] Test structure changes
- [ ] Build configuration changes
- [ ] New feature branches merge major changes

## Memory Bank Files

- `file-structure-diagram.md` - Main diagram and architecture overview
- `update-tracker.md` - This tracking system (current file)
- `change-history.json` - Machine-readable change history (future)

## Integration Points

This tracking system integrates with:
- **CLAUDE.md** development guidelines
- **Git commit hooks** (future enhancement)
- **CI/CD pipeline** documentation
- **Component library** documentation

---

*Last Updated: 2025-09-12*
*Next Review: When major structural changes occur*