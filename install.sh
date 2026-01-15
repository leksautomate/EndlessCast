#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                         ENDLESSCAST INSTALLER                              ║
# ║                     24/7 Multi-Platform Broadcasting                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ASCII Art Banner
print_banner() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                           ║"
    echo "║   ███████╗███╗   ██╗██████╗ ██╗     ███████╗███████╗███████╗             ║"
    echo "║   ██╔════╝████╗  ██║██╔══██╗██║     ██╔════╝██╔════╝██╔════╝             ║"
    echo "║   █████╗  ██╔██╗ ██║██║  ██║██║     █████╗  ███████╗███████╗             ║"
    echo "║   ██╔══╝  ██║╚██╗██║██║  ██║██║     ██╔══╝  ╚════██║╚════██║             ║"
    echo "║   ███████╗██║ ╚████║██████╔╝███████╗███████╗███████║███████║             ║"
    echo "║   ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝             ║"
    echo "║                                                                           ║"
    echo "║   ██████╗ █████╗ ███████╗████████╗                                       ║"
    echo "║  ██╔════╝██╔══██╗██╔════╝╚══██╔══╝                                       ║"
    echo "║  ██║     ███████║███████╗   ██║                                          ║"
    echo "║  ██║     ██╔══██║╚════██║   ██║                                          ║"
    echo "║  ╚██████╗██║  ██║███████║   ██║                                          ║"
    echo "║   ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝                                          ║"
    echo "║                                                                           ║"
    echo "║                    24/7 Multi-Platform Broadcasting                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print styled message
print_step() {
    echo -e "${CYAN}[>]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

# Check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    fi
    return 0  # Port is available
}

# Main installation function
main() {
    clear
    print_banner
    
    echo ""
    echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║              ENDLESSCAST INSTALLATION WIZARD                 ║${NC}"
    echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Step 1: Check system requirements
    print_step "Checking system requirements..."
    echo ""

    # Check Node.js
    if check_command node; then
        NODE_VERSION=$(node -v)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+ first."
        echo -e "    ${CYAN}Visit: https://nodejs.org/${NC}"
        exit 1
    fi

    # Check npm
    if check_command npm; then
        NPM_VERSION=$(npm -v)
        print_success "npm installed: v$NPM_VERSION"
    else
        print_error "npm not found. Please install npm first."
        exit 1
    fi

    # Check FFmpeg
    if check_command ffmpeg; then
        FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n1 | awk '{print $3}')
        print_success "FFmpeg installed: $FFMPEG_VERSION"
    else
        print_warning "FFmpeg not found. Installing FFmpeg is required for streaming."
        echo -e "    ${CYAN}Install with: sudo apt install ffmpeg${NC}"
        echo ""
        read -p "Continue anyway? (y/n): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    echo ""

    # Step 2: Port Selection
    print_step "Port Configuration"
    echo ""
    echo -e "${BOLD}Select a port to run EndlessCast:${NC}"
    echo ""
    
    # Define port options
    PORTS=(3000 4000 5000 8000 8080 8888 9000 9090)
    
    # Display port options with availability status
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  #   PORT    STATUS                                        │${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    
    for i in "${!PORTS[@]}"; do
        PORT=${PORTS[$i]}
        if check_port $PORT; then
            STATUS="${GREEN}Available${NC}"
        else
            STATUS="${RED}In Use${NC}"
        fi
        printf "${CYAN}│${NC}  %-2s  %-6s  %-40s ${CYAN}│${NC}\n" "$((i+1))" "$PORT" "$STATUS"
    done
    
    echo -e "${CYAN}│${NC}  9   Custom port                                           ${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    while true; do
        read -p "Enter your choice (1-9) [default: 3]: " PORT_CHOICE
        PORT_CHOICE=${PORT_CHOICE:-3}  # Default to option 3 (port 5000)
        
        if [[ "$PORT_CHOICE" == "9" ]]; then
            read -p "Enter custom port (1024-65535): " CUSTOM_PORT
            if [[ "$CUSTOM_PORT" =~ ^[0-9]+$ ]] && [ "$CUSTOM_PORT" -ge 1024 ] && [ "$CUSTOM_PORT" -le 65535 ]; then
                SELECTED_PORT=$CUSTOM_PORT
            else
                print_error "Invalid port. Please enter a number between 1024 and 65535."
                continue
            fi
        elif [[ "$PORT_CHOICE" =~ ^[1-8]$ ]]; then
            SELECTED_PORT=${PORTS[$((PORT_CHOICE-1))]}
        else
            print_error "Invalid choice. Please enter 1-9."
            continue
        fi
        
        # Check if selected port is available
        if check_port $SELECTED_PORT; then
            print_success "Port $SELECTED_PORT selected and available!"
            break
        else
            print_warning "Port $SELECTED_PORT is in use. Choose another port."
        fi
    done

    echo ""

    # Step 3: Install dependencies
    print_step "Installing dependencies..."
    echo ""
    
    if [ -f "package.json" ]; then
        npm install 2>&1 | while IFS= read -r line; do
            echo -e "    ${CYAN}>${NC} $line"
        done
        print_success "Dependencies installed successfully!"
    else
        print_error "package.json not found. Are you in the EndlessCast directory?"
        exit 1
    fi

    echo ""

    # Step 4: Create/Update .env file
    print_step "Configuring environment..."
    
    ENV_FILE=".env"
    
    # Backup existing .env if it exists
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "${ENV_FILE}.backup"
        print_info "Existing .env backed up to .env.backup"
    fi
    
    # Create/Update .env with port
    if [ -f "$ENV_FILE" ]; then
        # Update existing PORT if present, otherwise add it
        if grep -q "^PORT=" "$ENV_FILE"; then
            sed -i "s/^PORT=.*/PORT=$SELECTED_PORT/" "$ENV_FILE"
        else
            echo "PORT=$SELECTED_PORT" >> "$ENV_FILE"
        fi
    else
        echo "PORT=$SELECTED_PORT" > "$ENV_FILE"
    fi
    
    print_success "Environment configured with PORT=$SELECTED_PORT"

    echo ""

    # Step 5: Update package.json dev script to use selected port
    print_step "Updating development scripts..."
    
    # Create a start script for the selected port
    cat > start.sh << EOF
#!/bin/bash
# EndlessCast Startup Script
# Port: $SELECTED_PORT

echo -e "\033[0;32m"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║             STARTING ENDLESSCAST SERVER                   ║"
echo "║                    Port: $SELECTED_PORT                            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "\033[0m"

export PORT=$SELECTED_PORT
npm run dev
EOF
    
    chmod +x start.sh
    print_success "Created start.sh script"

    echo ""

    # Step 6: Create systemd service file (optional)
    print_step "Creating systemd service file..."
    
    SERVICE_FILE="endlesscast.service"
    CURRENT_DIR=$(pwd)
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=EndlessCast 24/7 Streaming Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
Environment=PORT=$SELECTED_PORT
Environment=NODE_ENV=production
ExecStart=$CURRENT_DIR/start.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    print_success "Created $SERVICE_FILE"
    print_info "To install as a system service:"
    echo -e "    ${CYAN}sudo cp $SERVICE_FILE /etc/systemd/system/${NC}"
    echo -e "    ${CYAN}sudo systemctl enable endlesscast${NC}"
    echo -e "    ${CYAN}sudo systemctl start endlesscast${NC}"

    echo ""

    # Step 7: Final Summary
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                    INSTALLATION COMPLETE!                                 ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BOLD}Configuration Summary:${NC}"
    echo -e "  ${CYAN}•${NC} Port: ${GREEN}$SELECTED_PORT${NC}"
    echo -e "  ${CYAN}•${NC} Start Script: ${GREEN}./start.sh${NC}"
    echo -e "  ${CYAN}•${NC} Systemd Service: ${GREEN}$SERVICE_FILE${NC}"
    echo ""
    
    echo -e "${BOLD}Quick Start Commands:${NC}"
    echo -e "  ${CYAN}Development:${NC}  ./start.sh"
    echo -e "  ${CYAN}Or manually:${NC}  PORT=$SELECTED_PORT npm run dev"
    echo ""
    
    echo -e "${BOLD}Default Login Credentials:${NC}"
    echo -e "  ${CYAN}Password:${NC} admin"
    echo ""
    
    echo -e "${BOLD}Access your dashboard at:${NC}"
    echo -e "  ${CYAN}Local:${NC}    ${GREEN}http://localhost:$SELECTED_PORT${NC}"
    echo -e "  ${CYAN}Network:${NC}  ${GREEN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-ip"):$SELECTED_PORT${NC}"
    echo ""
    
    # Ask if user wants to start now
    read -p "Start EndlessCast now? (y/n): " START_NOW
    if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
        echo ""
        print_step "Starting EndlessCast..."
        ./start.sh
    else
        echo ""
        print_info "Run './start.sh' when ready to start EndlessCast."
    fi
}

# Run main function
main "$@"
