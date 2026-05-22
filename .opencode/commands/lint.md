Run all linting and type checks for Flame ADE.

1. TypeScript type check:
   ```bash
   pnpm exec tsc --noEmit
   ```

2. Rust lint:
   ```bash
   cd src-tauri && cargo clippy -- -D warnings
   ```

3. Report all issues with file paths and line numbers.

4. If there are fixable issues, suggest fixes.
