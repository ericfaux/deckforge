# Contributing to DeckForge

Thank you for your interest in contributing to DeckForge! This document provides guidelines and instructions for contributing.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/deckforge.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with conventional commits (see below)
7. Push and create a Pull Request

## 📋 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional

## 🎯 What Can I Contribute?

### Good First Issues
- Documentation improvements
- Bug fixes
- UI polish (animations, spacing, colors)
- Accessibility improvements
- Mobile responsiveness fixes

### Advanced Contributions
- New tools for the canvas editor
- Performance optimizations
- New export formats
- Integration with third-party services
- Testing infrastructure

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account (for backend features)

### Local Development

```bash
cd webapp
npm install
npm run dev
```

App runs on `http://localhost:5173`

### Environment Variables

Create `webapp/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without changing behavior
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process, dependencies, etc.

### Examples

```
feat(canvas): add bezier curve tool

Added bezier curve drawing tool with control points.
Users can now draw smooth curves in the canvas editor.

Closes #123
```

```
fix(export): correct PNG resolution calculation

Fixed issue where exported PNGs were pixelated.
Now respects the specified DPI setting.

Fixes #456
```

## 🧪 Testing

### Before Submitting
- [ ] App builds without errors: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Manual testing in browser
- [ ] Test on mobile (if UI changes)
- [ ] Check accessibility (keyboard navigation, screen reader)

### Testing Checklist
- [ ] Existing features still work
- [ ] New feature works as expected
- [ ] Error states handled gracefully
- [ ] Loading states shown appropriately
- [ ] Mobile responsive
- [ ] Keyboard accessible

## 📐 Code Style

### TypeScript
- Use TypeScript for all new files
- Avoid `any` types when possible
- Define interfaces for complex objects
- Use generics for reusable components

### React
- Prefer functional components with hooks
- Use `memo` for expensive components
- Keep components small and focused
- Extract custom hooks for reusable logic

### CSS
- Use Tailwind utility classes
- Follow existing spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
- Use CSS variables for theme colors
- Ensure dark mode compatibility

### File Organization
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   └── deckforge/       # App-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Route components
└── store/               # State management
```

## 🎨 UI Guidelines

### Design Principles
- **Simplicity:** Clean, uncluttered interfaces
- **Consistency:** Reuse existing patterns
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** 60fps animations, lazy loading

### Component Checklist
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Keyboard navigation
- [ ] Touch-friendly (44x44px tap targets)
- [ ] Proper ARIA labels
- [ ] Focus indicators

## 🪝 Creating Custom Hooks

Follow these patterns:

```typescript
// hooks/use-example.ts
import { useState, useEffect } from 'react';

export function useExample<T>(initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // cleanup
    };
  }, []);

  return [value, setValue];
}
```

### Hook Guidelines
- Type-safe with generics
- Clean up side effects
- SSR-safe (check for `window`)
- Document use cases

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try reproducing in incognito mode
3. Check browser console for errors

### Include in Report
- OS and browser version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Console errors (if any)

## ✨ Feature Requests

### Good Feature Requests Include
- Clear use case
- Why it's valuable
- How it fits into existing workflow
- Mockups/examples (if applicable)

## 📚 Documentation

### Updating Docs
- Update README for major features
- Add JSDoc comments for public APIs
- Include code examples
- Update CHANGELOG.md

## 🔄 Pull Request Process

1. **Title:** Use conventional commit format
2. **Description:** Explain what and why
3. **Screenshots:** Include for UI changes
4. **Testing:** List how you tested
5. **Breaking Changes:** Highlight any
6. **Related Issues:** Link with `Closes #123`

### PR Checklist
- [ ] Follows code style
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Conventional commit format
- [ ] No merge conflicts
- [ ] Reasonable commit count (squash if needed)

## 🎖️ Recognition

Contributors are recognized in:
- README.md
- CHANGELOG.md
- GitHub contributors page

## 📞 Questions?

- Open a GitHub Discussion
- Join our Discord (link in README)
- Email: contribute@deckforge.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making DeckForge better! 🙏
