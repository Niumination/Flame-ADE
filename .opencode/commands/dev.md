Start the Flame ADE development server.

1. First, ensure all dependencies are installed:
   ```bash
   pnpm install
   ```

2. Start the Tauri dev server:
   ```bash
   pnpm tauri dev
   ```

3. Wait for the app window to open.

4. Check the console for any errors.

If you encounter any issues:
- Check Rust installation: `rustc --version`
- Check Node.js: `node --version`
- Clean and reinstall: `rm -rf node_modules && pnpm install`
