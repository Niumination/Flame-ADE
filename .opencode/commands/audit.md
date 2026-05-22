Run security audit on Flame ADE.

1. Rust security audit:
   ```bash
   cd src-tauri && cargo audit
   ```

2. Node security audit:
   ```bash
   pnpm audit
   ```

3. Check for hardcoded secrets:
   ```bash
   grep -r "api_key\|apiKey\|secret\|token" src/ src-tauri/src/ --include="*.rs" --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "target"
   ```

4. Review any vulnerabilities and suggest fixes.

5. Report overall security status.
