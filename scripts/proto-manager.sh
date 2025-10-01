#!/bin/bash

# Proto Management Script for NestJS
# This script compiles proto files and generates TypeScript types

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROTO_ROOT="./proto"
BUILD_DIR="./generated"
NODE_MODULES="./node_modules"

print_header() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}  Proto Compiler for NestJS${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if protoc is installed
check_protoc() {
    if ! command -v protoc &> /dev/null; then
        print_error "protoc is not installed. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install protobuf
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y protobuf-compiler
        else
            print_error "Please install protoc manually for your system"
            exit 1
        fi
    fi
    print_success "protoc found: $(protoc --version)"
}

# Check and install required npm packages
check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check if key files exist instead of using npm list (which has issues)
    if [ ! -f "$NODE_MODULES/.bin/protoc-gen-ts_proto" ] && [ ! -f "$NODE_MODULES/ts-proto/protoc-gen-ts_proto" ]; then
        print_warning "ts-proto not found, attempting to install..."
        npm install --save-dev ts-proto || print_error "Failed to install ts-proto"
    else
        print_success "ts-proto found"
    fi
    
    if [ ! -f "$NODE_MODULES/.bin/grpc_tools_node_protoc" ] && [ ! -f "$NODE_MODULES/grpc-tools/bin/grpc_tools_node_protoc" ]; then
        print_warning "grpc-tools not found, attempting to install..."
        npm install grpc-tools || print_error "Failed to install grpc-tools"
    else
        print_success "grpc-tools found"
    fi
    
    print_success "Dependencies checked"
}

# Validate proto files
validate_protos() {
    print_info "Validating proto files..."
    
    local failed=0
    
    # Find all .proto files and validate them
    while IFS= read -r -d '' file; do
        relative_file=${file#$PROTO_ROOT/}
        echo "Validating: $relative_file"
        
        if ! protoc --proto_path="$PROTO_ROOT" --descriptor_set_out=/dev/null "$relative_file" 2>/dev/null; then
            print_error "Validation failed: $relative_file"
            # Show the actual error
            protoc --proto_path="$PROTO_ROOT" --descriptor_set_out=/dev/null "$relative_file"
            failed=1
        else
            print_success "Valid: $relative_file"
        fi
    done < <(find "$PROTO_ROOT" -name "*.proto" -print0)
    
    if [ $failed -eq 1 ]; then
        print_error "Some proto files failed validation"
        exit 1
    fi
    
    print_success "All proto files are valid"
}

# Generate TypeScript interfaces using ts-proto
generate_typescript() {
    print_info "Generating TypeScript definitions with ts-proto..."
    
    # Create build directory
    mkdir -p "$BUILD_DIR/typescript"
    
    # Find the ts-proto plugin
    TS_PROTO_PLUGIN=""
    if [ -f "$NODE_MODULES/.bin/protoc-gen-ts_proto" ]; then
        TS_PROTO_PLUGIN="$NODE_MODULES/.bin/protoc-gen-ts_proto"
    elif [ -f "$NODE_MODULES/ts-proto/protoc-gen-ts_proto" ]; then
        TS_PROTO_PLUGIN="$NODE_MODULES/ts-proto/protoc-gen-ts_proto"
    else
        print_error "ts-proto plugin not found. Please install ts-proto: npm install --save-dev ts-proto"
        return 1
    fi
    
    print_info "Using ts-proto plugin: $TS_PROTO_PLUGIN"
    
    # Find all proto files and generate TypeScript
    find "$PROTO_ROOT" -name "*.proto" -exec protoc \
        --proto_path="$PROTO_ROOT" \
        --plugin="protoc-gen-ts_proto=$TS_PROTO_PLUGIN" \
        --ts_proto_out="$BUILD_DIR/typescript" \
        --ts_proto_opt=esModuleInterop=true \
        --ts_proto_opt=forceLong=long \
        --ts_proto_opt=useOptionals=messages \
        --ts_proto_opt=nestJs=true \
        {} \;
    
    print_success "TypeScript generation completed"
    print_info "Generated files are in: $BUILD_DIR/typescript"
}

# Generate Node.js gRPC code
generate_grpc() {
    print_info "Generating Node.js gRPC code..."
    
    mkdir -p "$BUILD_DIR/grpc"
    
    # Generate JavaScript and gRPC code
    find "$PROTO_ROOT" -name "*.proto" -exec npx grpc_tools_node_protoc \
        --proto_path="$PROTO_ROOT" \
        --js_out=import_style=commonjs,binary:"$BUILD_DIR/grpc" \
        --grpc_out=grpc_js:"$BUILD_DIR/grpc" \
        {} \;
    
    # Generate TypeScript definitions for the generated JS
    find "$PROTO_ROOT" -name "*.proto" -exec npx grpc_tools_node_protoc \
        --proto_path="$PROTO_ROOT" \
        --plugin=protoc-gen-ts="$NODE_MODULES/.bin/grpc_tools_node_protoc_ts" \
        --ts_out=grpc_js:"$BUILD_DIR/grpc" \
        {} \; 2>/dev/null || print_warning "TypeScript definitions generation failed (optional)"
    
    print_success "gRPC code generation completed"
    print_info "Generated files are in: $BUILD_DIR/grpc"
}

# List all proto files and their structure
list_protos() {
    print_info "Proto file structure:"
    echo
    if command -v tree &> /dev/null; then
        tree "$PROTO_ROOT" -I "*.md|*.txt"
    else
        find "$PROTO_ROOT" -name "*.proto" | sort
    fi
    echo
    
    print_info "Proto file statistics:"
    echo "Total proto files: $(find "$PROTO_ROOT" -name "*.proto" | wc -l | tr -d ' ')"
    echo "Services: $(find "$PROTO_ROOT" -name "*.proto" -exec grep -l "service " {} \; | wc -l | tr -d ' ')"
    echo "Messages: $(find "$PROTO_ROOT" -name "*.proto" -exec grep -c "message " {} \; | awk '{sum+=$1} END {print sum}')"
}

# Clean generated files
clean() {
    print_info "Cleaning generated files..."
    rm -rf "$BUILD_DIR"
    print_success "Generated files cleaned"
}

# Create example NestJS integration
create_nestjs_example() {
    print_info "Creating NestJS integration example..."
    
    mkdir -p examples
    
    cat > examples/nestjs-grpc-client.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user.v1',
          protoPath: join(__dirname, '../proto/user-service/users/user.proto'),
          loader: {
            enums: String,
            objects: true,
            arrays: true
          },
        },
      },
      {
        name: 'HRM_PACKAGE', 
        transport: Transport.GRPC,
        options: {
          package: 'hrm.v1',
          protoPath: join(__dirname, '../proto/hrm/organization/company.proto'),
          loader: {
            enums: String,
            objects: true,
            arrays: true
          },
        },
      },
    ]),
  ],
})
export class GrpcModule {}
EOF

    cat > examples/user.service.ts << 'EOF'
import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

interface UserService {
  createUser(data: any): any;
  findAllUsers(data: any): any;
  findOneUser(data: any): any;
  updateUser(data: any): any;
  removeUser(data: any): any;
}

@Injectable()
export class UserClientService {
  private userService: UserService;

  constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService');
  }

  async createUser(userData: any) {
    return this.userService.createUser(userData);
  }

  async findAllUsers(query: any) {
    return this.userService.findAllUsers(query);
  }
}
EOF

    print_success "NestJS examples created in ./examples/"
}

# Main script logic
main() {
    print_header
    
    case "$1" in
        "install")
            check_protoc
            check_dependencies
            ;;
        "validate")
            check_protoc
            validate_protos
            ;;
        "build")
            check_protoc
            check_dependencies
            validate_protos
            generate_typescript
            generate_grpc
            create_nestjs_example
            ;;
        "typescript"|"ts")
            check_protoc
            check_dependencies
            validate_protos
            generate_typescript
            ;;
        "grpc")
            check_protoc
            check_dependencies
            validate_protos
            generate_grpc
            ;;
        "list")
            list_protos
            ;;
        "clean")
            clean
            ;;
        "example")
            create_nestjs_example
            ;;
        "help"|"--help"|"-h"|"")
            echo "Usage: $0 [command]"
            echo
            echo "Commands:"
            echo "  install     - Install required dependencies"
            echo "  validate    - Validate all proto files"
            echo "  build       - Full build (TypeScript + gRPC + examples)"
            echo "  typescript  - Generate TypeScript definitions only"
            echo "  grpc        - Generate gRPC code only"
            echo "  list        - List all proto files and statistics"
            echo "  clean       - Clean generated files"
            echo "  example     - Create NestJS integration examples"
            echo "  help        - Show this help message"
            echo
            echo "Examples:"
            echo "  $0 install     # Install dependencies"
            echo "  $0 validate    # Check proto files"
            echo "  $0 build       # Generate everything"
            echo "  $0 typescript  # Generate TypeScript only"
            echo
            echo "Generated files will be in: $BUILD_DIR/"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
