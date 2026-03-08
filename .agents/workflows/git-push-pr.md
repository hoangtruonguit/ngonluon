---
description: stash changes, sync with main, create a feature branch with a summary name, commit, push, and create a PR
---

// turbo-all

1. Stash all current code changes.
```bash
git stash --include-untracked
```

2. Checkout the `main` branch and pull the latest changes.
```bash
git checkout main && git pull origin main
```

3. **Create a new branch.** Use `git stash show -p` to review the stashed changes, then generate a short, descriptive kebab-case branch name summarizing the changes (e.g., `feat/add-auth-context`, `fix/header-responsive`, `refactor/api-client`). Create and checkout the new branch.
```bash
git stash show -p
```
Then:
```bash
git checkout -b <generated-branch-name>
```

4. Apply the stashed changes back onto the new branch.
```bash
git stash pop
```

5. Stage and commit all changes with a clear, conventional commit message summarizing what was done.
```bash
git add -A && git commit -m "<conventional commit message>"
```

6. Push the new branch to the remote.
```bash
git push -u origin <branch-name>
```

7. **Create a Pull Request** to merge into `main` using the GitHub MCP tool `create_pull_request`. The PR should have:
   - A clear **title** summarizing the feature/fix
   - A detailed **body** in markdown listing all tasks/changes made, using a checklist format like:
     ```
     ## Changes
     - [x] Task 1 description
     - [x] Task 2 description

     ## Notes
     Any additional context or notes.
     ```
   Use the `mcp_github-mcp-server_create_pull_request` tool with `owner`, `repo`, `title`, `body`, `head` (new branch), and `base` (`main`).
