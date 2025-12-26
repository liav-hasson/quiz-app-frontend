# CI Pipeline

Jenkins pipeline and Docker configurations for frontend builds.

---
## Contents

| Path | Description |
|------|-------------|
| `Jenkinsfile` | Pipeline definition for build, test, push, deploy |
| `app-dockerfile/` | Production Dockerfile for React app |
| `jenkins-agent/` | Jenkins agent Docker image with Node.js |

---
## Pipeline Stages
1. Checkout - Pull latest frontend repository
2. Install - `npm ci`
3. Lint - ESLint checks
4. Build - `npm run build`
5. Docker Build - Build and tag container image
6. Push - Push to container registry
7. Deploy - Trigger GitOps update

---
## Related
- See [../scripts/README.md](../scripts/README.md) for deployment scripts
