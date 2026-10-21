# MakuluLinux Game Studio · Agent & Development Guidelines

## 1. GitHub Repository Details
- **Repository URL:** `https://github.com/raymerjacque/Makulu-Game-Studio`
- **Owner / Organization:** `raymerjacque`
- **Default Branch:** `main`
- **Authentication:** Local git credential store (`~/.config/git_studio_credentials` with permissions 600)

## 2. Mandatory Push Rule
- Whenever tasks, features, fixes, or milestones are completed, the agent **MUST** stage, commit, and push changes to the GitHub repository:
  ```bash
  cd /home/jacque/AI-center/PlayCanvas
  git add .
  git commit -m "<Clear descriptive summary of changes>"
  git push origin main
  ```

## 3. Strict Credential & Security Rule
- **NEVER** expose, commit, print, or log GitHub personal access tokens (PATs), backend API keys, or private secrets in:
  - Repository files (source code, markdown, configs)
  - Git commit messages
  - Chat responses or transcripts
  - Git remote URLs (remote URL must remain `https://github.com/raymerjacque/Makulu-Game-Studio.git`)
- Authentication is handled silently via the local machine's protected credential store.
- Never commit binary releases (`release/`, `*.AppImage`, `*.deb`), `dist/`, or `node_modules/` to version control.
