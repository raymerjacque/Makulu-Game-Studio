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

## 4. Start Here · Persistent Project Handoff
- Read `docs/CONTINUITY.md` at the start of every new chat/account session, then consult `roadmap.html`, `docs/project-format.md`, and the relevant capability reviews.
- Treat repository files and git state as the durable project record. Chat memory is supplementary and may not transfer between accounts.
- Before coding, inspect the working tree and recent commits; preserve unfinished work. Verify recorded assumptions against current source.
- At each milestone or handoff, update `docs/CONTINUITY.md` with the delivered scope, validation evidence, unresolved issues and exact next steps. Update `roadmap.html` for completed implementation work. Never describe planned work as completed.
- Preserve user-approved project requirements, decisions and project-owned AI prompt locations in local tracked documentation. Do not save private platform/system instructions, raw chat transcripts containing secrets, or credentials.
- Production backend API keys and key arrays are protected: do not delete, replace, reduce or filter them. Do not copy their values into this repository or handoff notes.
- Save source/document changes locally, then commit and push completed milestones under the rules above. Local recovery data, browser storage and credentials are not transferred by cloning GitHub.
