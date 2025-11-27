#!/bin/bash
# Demo script showing how to switch between Mock and Real API modes

echo "🎭 Mock API Mode Demo"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to frontend directory
cd /Users/orinbar/Public/quiz-app-frontend/react-app

echo -e "${BLUE}Current .env configuration:${NC}"
cat .env 2>/dev/null || echo "No .env file found"
echo ""

# Backup current .env
if [ -f .env ]; then
    echo -e "${YELLOW}Backing up current .env to .env.backup${NC}"
    cp .env .env.backup
fi

echo ""
echo -e "${GREEN}=== OPTION 1: Enable Mock API Mode ===${NC}"
echo ""
echo "Run this command to use mock data (no backend needed):"
echo ""
echo -e "${BLUE}cat > .env << EOF
VITE_USE_MOCK_API=true
VITE_GOOGLE_CLIENT_ID=mock-client-id
EOF${NC}"
echo ""
echo "Then start dev server:"
echo -e "${BLUE}npm run dev${NC}"
echo ""
echo "✅ Benefits:"
echo "  - No backend required"
echo "  - Fast development"
echo "  - Pre-loaded mock data"
echo "  - Perfect for UI work"
echo ""

echo -e "${GREEN}=== OPTION 2: Use Real Backend ===${NC}"
echo ""
echo "Run this command to connect to real backend:"
echo ""
echo -e "${BLUE}cat > .env << EOF
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-real-client-id
EOF${NC}"
echo ""
echo "Make sure backend is running:"
echo -e "${BLUE}cd ../../quiz-app-backend && docker-compose up -d${NC}"
echo ""
echo "✅ Benefits:"
echo "  - Real API integration"
echo "  - Data persistence"
echo "  - AI-generated questions"
echo "  - Full authentication"
echo ""

echo -e "${GREEN}=== OPTION 3: Use Dev Server ===${NC}"
echo ""
echo "Run this command to connect to deployed dev server:"
echo ""
echo -e "${BLUE}cat > .env << EOF
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://dev-quiz.weatherlabs.org:5000
VITE_GOOGLE_CLIENT_ID=827337954909-n9dkebe3lr2tt2lh7t3id3msith4dsff.apps.googleusercontent.com
EOF${NC}"
echo ""
echo "✅ Benefits:"
echo "  - Real backend without local setup"
echo "  - Shared dev environment"
echo "  - Latest backend version"
echo ""

echo -e "${YELLOW}=== Quick Test ===${NC}"
echo ""
echo "Want to try mock mode now? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${GREEN}Enabling Mock API Mode...${NC}"
    cat > .env << EOF
VITE_USE_MOCK_API=true
VITE_GOOGLE_CLIENT_ID=mock-client-id
EOF
    echo "✅ Mock mode enabled!"
    echo ""
    echo "Start dev server with:"
    echo -e "${BLUE}npm run dev${NC}"
    echo ""
    echo "You should see: ${GREEN}🎭 Using Mock API - No backend required!${NC} in the console"
else
    echo ""
    if [ -f .env.backup ]; then
        echo -e "${YELLOW}Restoring original .env${NC}"
        mv .env.backup .env
    fi
    echo "No changes made."
fi

echo ""
echo -e "${BLUE}📚 For more info, see:${NC}"
echo "  - MOCK_API_GUIDE.md (full documentation)"
echo "  - MOCK_API_QUICKSTART.md (quick reference)"
echo ""
