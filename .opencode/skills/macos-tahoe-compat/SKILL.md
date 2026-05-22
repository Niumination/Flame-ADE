# macOS Tahoe Compatibility Skill

Use this skill when testing or optimizing Flame ADE for macOS Tahoe 26.5.

## System Information

- **OS**: Hackintosh macOS Tahoe 26.5
- **Hardware**: ThinkPad X13 Yoga Gen 1
- **CPU**: Intel Core i5-10310U (10th gen, 4 cores, 8 threads)
- **GPU**: Intel UHD Graphics (integrated)
- **Shell**: zsh (default)

## Testing Checklist

### 1. Tauri Window Management
- [ ] `titleBarStyle: Overlay` renders correctly
- [ ] Native traffic lights visible and functional
- [ ] Window transparency works
- [ ] `hiddenTitle: true` hides title bar text
- [ ] Window resize is smooth
- [ ] Window state persistence (save/restore)

### 2. PTY Terminal
- [ ] PTY opens without errors
- [ ] Shell (zsh) starts correctly
- [ ] Shell integration scripts load
- [ ] OSC 7 (cwd reporting) works
- [ ] OSC 133 (prompt boundaries) works
- [ ] Multi-tab terminal works
- [ ] PTY resize on window resize
- [ ] Process cleanup on tab close

### 3. WebGL Rendering
- [ ] xterm.js WebGL renderer initializes
- [ ] True color support works
- [ ] No rendering artifacts
- [ ] Smooth scrolling performance
- [ ] Link detection works

### 4. File System
- [ ] File explorer loads directories
- [ ] Fuzzy search works
- [ ] File read/write operations
- [ ] Path normalization (forward-slash canonical)
- [ ] Home directory detection (`dirs::home_dir()`)

### 5. OS Keychain
- [ ] API keys stored in keychain
- [ ] API keys retrieved from keychain
- [ ] Keys not persisted to disk
- [ ] Keychain access on app restart

### 6. AI Integration
- [ ] AI provider configuration works
- [ ] API key authentication
- [ ] Chat sessions persist
- [ ] Voice input (microphone permission)
- [ ] Edit diffs render correctly

### 7. Performance
- [ ] App starts within 3 seconds
- [ ] Binary size under 10MB
- [ ] Memory usage reasonable (<500MB)
- [ ] No CPU spikes during normal use
- [ ] Smooth terminal rendering on Intel GPU

### 8. Security
- [ ] Path guards prevent access outside workspace
- [ ] SSRF protection on outbound HTTP
- [ ] Sandboxed web preview (iframe)
- [ ] No telemetry or analytics
- [ ] Secret path deny-list works

## Known Issues to Watch

### Tauri on macOS Tahoe
- Window management APIs may have changed
- Test `titleBarStyle: Overlay` thoroughly
- Verify transparency rendering

### Intel GPU WebGL
- WebGL may have different behavior on Intel UHD Graphics
- Test xterm.js WebGL renderer specifically
- Fallback to canvas renderer if needed

### Shell Integration
- macOS Tahoe may have updated zsh version
- Test init scripts with new zsh
- Verify OSC escape sequence handling

### Keychain Changes
- macOS Tahoe may have updated keychain APIs
- Test `keyring` crate integration
- Verify keychain access after app restart

## Debugging Commands

### Check Tauri logs
```bash
# Enable Tauri logging
export RUST_LOG=debug
pnpm tauri dev
```

### Check WebGL support
```javascript
// In browser console
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
console.log('WebGL2 supported:', !!gl);
console.log('Renderer:', gl?.getParameter(gl.RENDERER));
```

### Check keychain access
```bash
# List keychain entries for flame-ade
security find-generic-password -s flame-ade
```

### Monitor performance
```bash
# Monitor CPU and memory
top -pid $(pgrep -f "Flame ADE")
```

## Build for macOS

```bash
# Build for macOS
pnpm tauri build

# Output location
ls src-tauri/target/release/bundle/macos/

# Test the built app
open src-tauri/target/release/bundle/macos/Flame\ ADE.app
```

### Info.plist Permissions
Ensure `Info.plist` includes required permissions:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Flame ADE needs microphone access for voice input</string>
<key>NSCameraUsageDescription</key>
<string>Flame ADE needs camera access for...</string>
```

## Troubleshooting

### App won't start
```bash
# Check console logs
log show --predicate 'process == "Flame ADE"' --last 1h

# Check Tauri logs
tail -f ~/Library/Logs/app.flame.ade/*.log
```

### WebGL not working
- Check GPU compatibility
- Try canvas renderer fallback
- Update Intel GPU drivers

### Keychain errors
- Verify app signature
- Check keychain access groups
- Test with manual keychain access

### Shell integration fails
- Check zsh version: `zsh --version`
- Verify init scripts load
- Test OSC escape sequences manually
