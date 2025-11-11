# Custom Jenkins inbound agent for quiz-app frontend pipeline
# Base on the official Jenkins inbound agent with JDK 11 (compatible with Jenkins controller)
FROM jenkins/inbound-agent:4.13.3-1-jdk11

USER root

# Install required packages and tools
# - bash, curl, git: basic tooling for scripts and GitOps updates
# - Node.js 18 runtime: required for building the React frontend
# - docker-cli, buildctl: BuildKit client to build/push Docker images
# - hadolint: Dockerfile linter used in the pipeline
# - jq: handy JSON processor (used by npm audit output)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        bash \
        curl \
        git \
        ca-certificates \
        gnupg \
        docker.io \
        build-essential \
        jq && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g npm@10.2.3 && \
    # Install buildctl (BuildKit CLI)
    curl -L -o /tmp/buildkit.tgz https://github.com/moby/buildkit/releases/download/v0.12.5/buildkit-v0.12.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf /tmp/buildkit.tgz && \
    rm /tmp/buildkit.tgz && \
    # Install Hadolint
    curl -L -o /usr/local/bin/hadolint https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 && \
    chmod +x /usr/local/bin/hadolint && \
    # Clean up apt cache to reduce image size
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure npm package cache directory exists with write permissions
RUN mkdir -p /home/jenkins/.npm && chown -R jenkins:jenkins /home/jenkins/.npm

USER jenkins

# Default command inherited from inbound-agent
