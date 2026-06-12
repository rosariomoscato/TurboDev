---
name: react-component
description: Create React components following project conventions. Use when creating new React/TSX components, modifying existing component structure, or when the user asks to build a UI component.
---

# React Component Skill

## Overview

This skill guides the creation of React components that are consistent, well-typed, and follow the conventions already established in the project.

---

## Step 1: Read Existing Conventions

Before writing any component, **always** examine the existing codebase to understand the project's patterns.

### What to look for

1. **File naming**: Do existing components use PascalCase (`Button.tsx`), kebab-case (`button.tsx`), or another convention? Check 3–5 existing components to confirm.
2. **Directory structure**: Are components colocated with styles and tests (`Component/index.tsx`), flat (`components/Button.tsx`), or organized by feature (`features/auth/LoginForm.tsx`)?
3. **Export style**: Does the project use default exports, named exports, or barrel files (`index.ts` re-exporting everything)?
4. **Styling approach**: CSS Modules, Tailwind CSS, styled-components, CSS-in-JS, or inline styles? Follow whatever is already in use.
5. **Component style**: Functional components with hooks? Class components? Does the project use `React.FC`, inline return types, or explicit `Props` interfaces?
6. **State management**: Redux, Zustand, Jotai, Context API, or local state only?
7. **Testing patterns**: Does the project use Jest, Vitest, React Testing Library? Where are test files located?

### Where to look

- `src/components/` or equivalent component directory
- `ui/src/components/` for UI-level components
- `package.json` for dependencies (React version, styling libraries, testing libraries)
- `tsconfig.json` for path aliases and JSX settings

---

## Step 2: Component Creation Checklist

Follow this checklist for every component:

### 2.1 TypeScript Types

- Define a `Props` interface (or `ButtonProps`, `CardProps`, etc.) above the component.
- Use descriptive prop names. Prefer `isVisible` over `visible`, `onClick` over `click`.
- Mark optional props with `?`. Provide sensible defaults inside the component when needed.
- Use `children` with `React.ReactNode` when the component wraps content.
- Use specific event handler types: `React.MouseEvent<HTMLButtonElement>`, not generic `any`.
- For complex prop shapes, extract sub-types into named interfaces.

```tsx
// Good — explicit, self-documenting
interface AvatarProps {
  /** URL or path to the image. Falls back to initials if omitted. */
  src?: string;
  /** Display name used for alt text and initials fallback. */
  name: string;
  /** Size in pixels. @default 40 */
  size?: number;
  /** Called when the avatar is clicked. */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}
```

### 2.2 Component Structure

- Keep components focused on a single responsibility.
- Extract sub-components when a component grows beyond ~150 lines.
- Place helper/utility functions outside the component body to avoid re-creation on every render.
- Use `useCallback` and `useMemo` only when there is a measurable performance benefit — not by default.

```tsx
// Standard component layout order:
// 1. Imports
// 2. Types (Props interface)
// 3. Helper functions (outside component)
// 4. Component definition
// 5. Export
```

### 2.3 Barrel Exports

If the project uses barrel files (`index.ts`):

- Add the new component to the nearest barrel file.
- Use named re-exports: `export { Button } from './Button';`
- Do not re-export from nested barrel files in a chain — keep it one level deep.

### 2.4 Styling

- Match the project's existing styling approach exactly.
- If using Tailwind CSS, follow the same class ordering convention used in other components (layout → spacing → typography → colors → effects).
- If using CSS Modules, name the module file `ComponentName.module.css` and colocate it.
- Avoid `!important` and overly specific selectors.

### 2.5 Accessibility

- Use semantic HTML elements: `<button>` for buttons, `<nav>` for navigation, `<main>` for main content.
- Add `aria-label` to interactive elements without visible text.
- Ensure all interactive elements are keyboard-accessible (focusable, operable with Enter/Space).
- Use `role` attributes only when semantic HTML is insufficient.
- Add `alt` text to images. Use empty `alt=""` for decorative images.

### 2.6 Error Boundaries and Edge Cases

- Handle `null` and `undefined` prop values gracefully.
- Provide loading and error states for components that fetch data.
- Avoid crashing the entire UI when a single component fails — consider error boundaries for critical sections.
- Handle empty states: empty lists, missing data, no results.

---

## Step 3: Common Patterns

### 3.1 Basic Component

```tsx
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevation?: 'flat' | 'raised' | 'floating';
}

export function Card({ children, className, elevation = 'raised' }: CardProps) {
  return (
    <div className={`card card--${elevation} ${className ?? ''}`}>
      {children}
    </div>
  );
}
```

### 3.2 Component with Event Handlers

```tsx
import { type useState } from 'react';

interface ToggleProps {
  defaultChecked?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}

export function Toggle({ defaultChecked = false, label, onChange }: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setChecked(next);
    onChange?.(next);
  };

  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={handleChange} />
      <span>{label}</span>
    </label>
  );
}
```

### 3.3 Component that Renders a List

```tsx
interface Item {
  id: string;
  title: string;
  status: 'active' | 'archived';
}

interface ItemListProps {
  items: Item[];
  onSelect?: (item: Item) => void;
}

export function ItemList({ items, onSelect }: ItemListProps) {
  if (items.length === 0) {
    return <p className="empty-state">No items found.</p>;
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" onClick={() => onSelect?.(item)}>
            {item.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Step 4: Verification

After creating a component, verify:

1. **TypeScript compiles**: Run `tsc --noEmit` or the project's type-check command.
2. **Linting passes**: Run the project's linter (ESLint, etc.).
3. **No unused imports or variables**: Clean up any artifacts from development.
4. **The component renders**: If possible, verify in the running application.
5. **Barrel exports updated**: Ensure the component is exported if the project uses barrel files.

---

## Anti-Patterns to Avoid

- **Prop drilling**: If you're passing a prop through 3+ layers of components, consider Context or a state management library.
- **Giant components**: A component doing too many things should be split. Aim for components under 150 lines.
- **Inline object/array creation in JSX**: `style={{ color: 'red' }}` creates a new object on every render. Use `useMemo` or extract to a constant.
- **Index as key**: Using `array.map((item, index) => <div key={index}>)` causes issues with reordering. Use a stable unique identifier like `item.id`.
- **Copying patterns blindly**: If the project has a mix of old and new patterns, follow the newer ones and note inconsistencies.
