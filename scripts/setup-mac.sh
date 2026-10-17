#!/usr/bin/env bash
# ==============================================================================
# The Growth Archive — MacBook M1 (Apple Silicon) Full Setup Script
#
# Sets up Homebrew, Node.js, npm, project dependencies, local SQLite database,
# digital product binary assets, sample seed catalog, and admin credentials.
# Optimized specifically for macOS on Apple Silicon (M1 / M2 / M3 / M4 / arm64).
# ==============================================================================

set -eo pipefail

# Visual styling
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
PURPLE="\033[35m"
RESET="\033[0m"

# Error trap handler
cleanup_on_error() {
  local exit_code=$?
  local line_no=$1
  echo -e "\n${RED}${BOLD}✖ Setup encountered an error on line ${line_no} (Exit Code: ${exit_code})${RESET}"
  echo -e "${YELLOW}Please inspect the error message above. You can re-run this script safely.${RESET}\n"
  exit $exit_code
}
trap 'cleanup_on_error $LINENO' ERR

# ------------------------------------------------------------------------------
# 0. Banner
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║     THE GROWTH ARCHIVE — MACBOOK M1 / APPLE SILICON SETUP ENGINE      ║${RESET}"
echo -e "${BOLD}${CYAN}║         Next.js 16 • React 19 • Prisma SQLite • Digital Store         ║${RESET}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════════════╝${RESET}\n"

# ------------------------------------------------------------------------------
# 1. Project Directory Resolution
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/package.json" ]; then
  PROJECT_ROOT="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  PROJECT_ROOT="$(pwd)"
fi

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo -e "${RED}[ERROR] Could not locate package.json in '$PROJECT_ROOT'.${RESET}"
  echo -e "Please run this script from the website root directory."
  exit 1
fi

cd "$PROJECT_ROOT"
echo -e "${DIM}Working directory:${RESET} ${BOLD}$PROJECT_ROOT${RESET}"

# ------------------------------------------------------------------------------
# 2. Verify macOS & Apple Silicon Architecture
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[1/7] Verifying macOS & Apple Silicon M1/M2/M3 Environment...${RESET}"

OS_NAME="$(uname -s)"
if [[ "$OS_NAME" != "Darwin" ]]; then
  echo -e "${RED}[ERROR] This setup script is specifically designed for macOS.${RESET}"
  echo -e "Detected OS: $OS_NAME"
  exit 1
fi

ARCH="$(uname -m)"
IS_TRANSLATED=0
if sysctl -in sysctl.proc_translated &>/dev/null; then
  IS_TRANSLATED=$(sysctl -in sysctl.proc_translated)
fi

if [[ "$ARCH" == "arm64" ]]; then
  echo -e "  ${GREEN}✔${RESET} Native Apple Silicon ARM64 architecture confirmed (${BOLD}$ARCH${RESET})."
elif [[ "$IS_TRANSLATED" -eq 1 ]]; then
  echo -e "  ${YELLOW}⚠${RESET} Terminal is running in Rosetta 2 emulation (x86_64 translated on Apple Silicon)."
  echo -e "    ${DIM}Prisma and Node.js will operate in compatibility mode.${RESET}"
else
  echo -e "  ${CYAN}ℹ${RESET} Architecture: ${BOLD}$ARCH${RESET}"
fi

# Check Xcode Command Line Tools
if ! xcode-select -p &>/dev/null; then
  echo -e "  ${YELLOW}⚠ Xcode Command Line Tools not detected.${RESET}"
  echo -e "  Triggering installation prompt..."
  xcode-select --install || true
  echo -e "${YELLOW}Please complete the Xcode Command Line Tools installation in the pop-up dialog, then re-run this script.${RESET}"
  exit 1
else
  echo -e "  ${GREEN}✔${RESET} Xcode Command Line Tools found at: $(xcode-select -p)"
fi

# ------------------------------------------------------------------------------
# 3. Verify / Configure Homebrew for Apple Silicon
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[2/7] Checking Homebrew Package Manager...${RESET}"

# Add Apple Silicon standard Homebrew path to current session if present
if [ -x "/opt/homebrew/bin/brew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x "/usr/local/bin/brew" ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

if ! command -v brew &>/dev/null; then
  echo -e "  ${YELLOW}⚠ Homebrew is not installed.${RESET}"
  echo -e "  Installing Homebrew (the official macOS package manager)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  
  if [ -x "/opt/homebrew/bin/brew" ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    
    # Persist in shell profile if not already present
    SHELL_PROFILE="$HOME/.zprofile"
    if [ ! -f "$SHELL_PROFILE" ] || ! grep -q '/opt/homebrew/bin/brew shellenv' "$SHELL_PROFILE"; then
      echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$SHELL_PROFILE"
      echo -e "  ${GREEN}✔${RESET} Configured Homebrew in $SHELL_PROFILE"
    fi
  elif [ -x "/usr/local/bin/brew" ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi

BREW_PATH="$(command -v brew || true)"
if [ -n "$BREW_PATH" ]; then
  echo -e "  ${GREEN}✔${RESET} Homebrew is active: ${BOLD}$BREW_PATH${RESET} (v$(brew --version | head -n1 | cut -d' ' -f2))"
else
  echo -e "  ${YELLOW}⚠ Homebrew not in PATH, continuing with system tools...${RESET}"
fi

# ------------------------------------------------------------------------------
# 4. Check & Install Node.js (v20+ or v22+ LTS) and npm
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[3/7] Verifying Node.js & npm Runtime...${RESET}"

# Check for NVM if present
if [ -z "$(command -v node)" ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
fi

NODE_INSTALLED=0
NODE_MAJOR=0

if command -v node &>/dev/null; then
  NODE_VER="$(node -v)"
  NODE_MAJOR="$(echo "$NODE_VER" | sed -E 's/v([0-9]+).*/\1/')"
  if [ "$NODE_MAJOR" -ge 20 ]; then
    NODE_INSTALLED=1
  fi
fi

if [ "$NODE_INSTALLED" -eq 0 ]; then
  if command -v node &>/dev/null; then
    echo -e "  ${YELLOW}⚠ Current Node.js version ($NODE_VER) is older than recommended (Node 20+ / 22+).${RESET}"
  else
    echo -e "  ${YELLOW}⚠ Node.js is not installed.${RESET}"
  fi

  if command -v brew &>/dev/null; then
    echo -e "  ${CYAN}Installing Node.js via Homebrew...${RESET}"
    brew install node
    # Refresh PATH
    if [ -x "/opt/homebrew/bin/node" ]; then
      export PATH="/opt/homebrew/bin:$PATH"
    fi
  elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo -e "  ${CYAN}Installing Node.js LTS via NVM...${RESET}"
    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    source "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
  else
    echo -e "${RED}[ERROR] Could not install Node.js automatically.${RESET}"
    echo -e "Please install Node.js (v20 or v22 LTS) from https://nodejs.org/ and re-run this script."
    exit 1
  fi
fi

NODE_PATH="$(command -v node)"
NPM_PATH="$(command -v npm)"
NODE_VERSION="$(node -v)"
NPM_VERSION="$(npm -v)"
NODE_ARCH="$(node -p 'process.arch' 2>/dev/null || echo 'unknown')"

echo -e "  ${GREEN}✔${RESET} Node.js Runtime: ${BOLD}$NODE_VERSION${RESET} (${NODE_ARCH}) at $NODE_PATH"
echo -e "  ${GREEN}✔${RESET} npm Package Mgr: ${BOLD}v$NPM_VERSION${RESET} at $NPM_PATH"

# ------------------------------------------------------------------------------
# 5. Environment & Storage Configuration (.env)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[4/7] Preparing Environment Variables & Directories...${RESET}"

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo -e "  ${CYAN}ℹ Creating .env from .env.example template...${RESET}"
    cp .env.example .env
    echo -e "  ${GREEN}✔${RESET} .env generated with pre-configured local development settings."
  else
    echo -e "  ${YELLOW}⚠ .env.example not found; creating minimal development .env...${RESET}"
    cat << 'EOF' > .env
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="admin@thegrowtharchive.com"
ADMIN_PASSWORD="ReplaceWithSecurePassphrase2026!#"
RAZORPAY_KEY_ID="rzp_test_growtharchive"
RAZORPAY_KEY_SECRET="growth_secret_key_mock"
RAZORPAY_WEBHOOK_SECRET="webhook_secret_hash_verify"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_growtharchive"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
STORAGE_DIR="./storage/products"
RESEND_API_KEY=""
EMAIL_FROM="The Growth Archive <orders@thegrowtharchive.com>"
EOF
    echo -e "  ${GREEN}✔${RESET} Default .env generated."
  fi
else
  echo -e "  ${GREEN}✔${RESET} Existing .env configuration detected."
fi

# Ensure private storage directory exists
mkdir -p storage/products
echo -e "  ${GREEN}✔${RESET} Storage directory verified at: storage/products/"

# ------------------------------------------------------------------------------
# 6. Install Project npm Packages
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[5/7] Installing Website npm Packages & Dependencies...${RESET}"
echo -e "  ${DIM}Running npm install...${RESET}"

npm install

echo -e "  ${GREEN}✔${RESET} All dependencies installed cleanly."

# ------------------------------------------------------------------------------
# 7. Database Initialization & Asset Generation
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[6/7] Initializing Prisma SQLite Database & Generating Assets...${RESET}"

# Generate Prisma Client specifically for SQLite local mode
echo -e "  ${DIM}Generating Prisma Client for SQLite...${RESET}"
npx prisma generate --schema=prisma/schema.sqlite.prisma

# Push schema changes to dev.db
echo -e "  ${DIM}Applying SQLite schema to dev.db...${RESET}"
npx prisma db push --schema=prisma/schema.sqlite.prisma

# Generate product assets (PDF dossiers & ZIP archives)
echo -e "  ${DIM}Generating product PDF & bundle assets in storage/products/...${RESET}"
npx tsx scripts/generate-assets.ts

# Seed catalog (products, bundles, coupons)
echo -e "  ${DIM}Seeding product catalog & test coupons...${RESET}"
npx prisma db seed

# Provision default admin credentials
echo -e "  ${DIM}Provisioning administrator account...${RESET}"
npx tsx scripts/create-admin.ts

echo -e "  ${GREEN}✔${RESET} Database, assets, and seed data initialized successfully."

# ------------------------------------------------------------------------------
# 8. Verification & Next Steps
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[7/7] Verifying System Build & Health...${RESET}"

echo -e "  ${DIM}Running TypeScript type-safety check...${RESET}"
npx tsc --noEmit
echo -e "  ${GREEN}✔${RESET} TypeScript compilation check passed (zero errors)."

echo -e "\n${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║                SETUP COMPLETED SUCCESSFULLY FOR MACBOOK M1            ║${RESET}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════════════════╝${RESET}\n"

echo -e "${BOLD}Website Credentials & Endpoints:${RESET}"
echo -e "  • ${BOLD}Storefront:${RESET}        ${CYAN}http://localhost:3000${RESET}"
echo -e "  • ${BOLD}Admin Center:${RESET}      ${CYAN}http://localhost:3000/admin${RESET}"
echo -e "  • ${BOLD}Admin Email:${RESET}       ${GREEN}admin@thegrowtharchive.com${RESET}"
echo -e "  • ${BOLD}Admin Password:${RESET}    ${GREEN}ReplaceWithSecurePassphrase2026!#${RESET}"
echo -e "  • ${BOLD}Test Coupon:${RESET}       ${GREEN}LAUNCH20${RESET} (20% off at checkout)\n"

echo -e "${BOLD}Commands to run your website:${RESET}"
echo -e "  1. ${CYAN}npm run dev${RESET}        ${DIM}→ Start development server with Turbopack (http://localhost:3000)${RESET}"
echo -e "  2. ${CYAN}npm run demo${RESET}       ${DIM}→ Automated local browser test runner with testing cheatsheet${RESET}"
echo -e "  3. ${CYAN}npm run test${RESET}       ${DIM}→ Run complete 64-point security, rate limit & E2E test suite${RESET}"
echo -e "  4. ${CYAN}npm run db:studio${RESET}  ${DIM}→ Open visual Prisma Studio GUI for database inspection${RESET}\n"

echo -e "${BOLD}To start the server right now, run:${RESET}"
echo -e "  ${GREEN}npm run dev${RESET}\n"
