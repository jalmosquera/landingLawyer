# Backend quality baseline

The backend contains legacy lint and formatting debt that predates the current
CI setup. To keep the production release gate meaningful without introducing a
large, high-risk refactor, CI currently blocks only Ruff's runtime-critical
rules:

- `E9`: syntax errors
- `F63`: invalid comparison expressions
- `F7`: invalid syntax-related constructs
- `F82`: undefined names in exception handlers

The full Ruff profile and `ruff format --check` will be enabled in a dedicated
cleanup change after the legacy codebase has been reviewed and normalized.
