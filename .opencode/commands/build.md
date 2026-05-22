Build Flame ADE for production.

1. Run TypeScript type check:
   ```bash
   pnpm exec tsc --noEmit
   ```

2. Run Rust lint:
   ```bash
   cd src-tauri && cargo clippy
   ```

3. Build the production bundle:
   ```bash
   pnpm tauri build
   ```

4. Check the output in `src-tauri/target/release/bundle/`

5. Report build status and any errors.
