# Contributing to Flame ADE

Thank you for your interest in contributing to Flame ADE!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Start dev server: `pnpm tauri dev`
5. Make your changes
6. Run checks: `pnpm exec tsc --noEmit && cd src-tauri && cargo clippy`
7. Commit and push
8. Open a pull request

## Development Guidelines

### Code Style
- Follow existing code conventions
- Use TypeScript strict mode
- Rust: follow `cargo clippy` recommendations
- No console.log in production code

### Commits
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Keep commits small and focused
- Write descriptive commit messages

### Testing
- Write tests for new features
- Run `pnpm test` before submitting PR
- Run `cargo test` for Rust code

### Security
- Never commit secrets or API keys
- Follow security best practices
- Review the security checklist in SECURITY.md

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Run all checks
4. Open PR to `develop`
5. Request review
6. Address feedback
7. Merge after approval

## Reporting Issues

- Use GitHub Issues
- Include system information (OS, hardware)
- Provide steps to reproduce
- Include screenshots if applicable

## Code of Conduct

Be respectful and constructive in all interactions.
