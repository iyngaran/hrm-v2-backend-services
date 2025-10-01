# 📁 Recommended NestJS Folder Structure

```plaintext
src/
│
├── main.ts                        # App bootstrap
├── app.module.ts                  # Root module
│
├── config/                        # Configuration management
│   ├── config.module.ts
│   ├── config.service.ts
│   └── database.config.ts
│
├── common/                        # Shared resources across modules
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── exceptions/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── utils/
│   └── constants.ts
│
├── core/                          # App-wide essentials (auth, user, roles)
│   ├── auth/
│   ├── user/
│   ├── role/
│   └── permission/
│
├── modules/                       # HRM-specific modules (your business logic)
│   ├── employee/                  # Example: Employee module
│   │   ├── employee.module.ts
│   │   ├── employee.controller.ts
│   │   ├── employee.service.ts
│   │   ├── employee.entity.ts
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── employee.mapper.ts
│   │
│   ├── field-config/              # Manages field configuration
│   │   ├── field-config.module.ts
│   │   ├── field-config.controller.ts
│   │   ├── field-config.service.ts
│   │   ├── field-config.entity.ts
│   │   └── dto/
│   │
│   ├── leave/
│   ├── attendance/
│   └── payroll/
│
├── database/                      # TypeORM or Prisma setup
│   ├── migrations/
│   ├── seed/
│   └── database.module.ts
│
├── storage/                       # File upload, document management
│
├── jobs/                          # Async jobs (Bull, Schedule)
│
├── libs/                          # Shared services (email, sms, etc.)
│   ├── mailer/
│   ├── sms/
│   └── notifications/
│
└── test/                          # Unit and e2e tests
```

# Additional Packages

1. **npm install pino nestjs-pino** - For logging

# NestJS Project Setup Guide

This guide will help you set up a new NestJS project with a recommended folder structure for an HRM (Human Resource Management) backend application. The structure is designed to be modular, scalable, and maintainable.

1. **Install/Update NestJS CLI**

To create a new NestJS project, you can use the NestJS CLI. If you haven't installed it yet, you can do so with:

```bash
sudo pnpm install -g @nestjs/cli@latest
```

2. **Create new NestJS Project**

To create a new NestJS project, you can use the following command:

```bash
nest new hrm-backend
```

3. **To convert the project to monorepo**

```bash
nest generate app hrm-service
```

4. **Rename the default application directory `hrm-backend` to `api-gateway`**

```bash
mv hrm-backend api-gateway
```

5. **To run the service**

```bash
pnpm run start:dev ## This will start the api-gateway service
pnpm run start:dev hrm-service ## This will start the hrm-service
```

6. **Create the user resource in `apps/user-service`**

```bash
nest generate resource users
```

The cli will prompt you to choose under which service you want to create the resource. Choose `user-service` and then select the options for the resource as per your requirements. It will create the necessary files for the user resource in the `apps/user-service/src/users` directory.

Transport layer - Microservice (Not HTTP)

7. **Install microservices dependencies**

```bash
 pnpm add @nestjs/microservices @grpc/grpc-js @grpc/proto-loader ts-proto
```

8. **Update the `user.proto` file**

Edit the `user.proto` file located at `apps/user-service/src/users/user.proto` to define your gRPC service and messages. Here’s an example of how it might look:

```proto
syntax = "proto3";
....
```

9. **Install necessary packages to compile proto files**

```bash
brew install grpc protobuf
```

10. **Compile the proto files**

To compile the proto files and generate TypeScript definitions, you can use the `ts-proto` plugin. Make sure you have it installed:

make sure you have link the `node` modules binary to the global path

```bash
brew link --overwrite node
```

Then, you can run the following command to generate the TypeScript files from your proto definitions:

```bash
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./ --ts_proto_opt=nestJs=true ./proto/user-service/users/user.proto
```

We need to move the generated types to the `libs/types` directory so we can share the code easily and maintain it better.

11. **Create new common library `libs`**

```bash
nest generate lib libs
```

12. **Move the generated types to the `libs/types` directory**

```bash
mv ./proto/user-service/users/*.ts ./libs/types/src/
```

13. **Update the `libs/types/src/index.ts` file**

```typescript
export * from './user';
```

14. **Update the `libs/index.ts` file**

```typescript
export * from './types';
// export * from './libs.module'; // Uncomment if you have a libs module
// export * from './libs.service'; // Uncomment if you have a libs service
```

15. **Refactor the nest cli**

We need to modify the `nest-cli.json` so that it actually copies over our Proto definition folder at the source of our project into the out project in the dist directory.

```json
 "user-service": {
      "type": "application",
      "root": "apps/user-service",
      "entryFile": "src/main",
      "sourceRoot": "./",
      "compilerOptions": {
        "tsConfigPath": "apps/user-service/tsconfig.app.json",
        "assets": ["proto/**/*.proto"],
        "watchAssets": true
      }
}
```

do the same for all the projects `hrm-service` and `api-gateway` services.

### We need to do the same at the root of our definitions

```json
  "collection": "@nestjs/schematics",
  "sourceRoot": "./",
  "entryFile": "/src/main",
```

16. **Now when we run the application, the proto files will be copied to the output directory.**

```
pnpm run start:dev user-service
```

This will start the `user-service` and copy the proto files to the output directory. `dist/user-service/users/user.proto`

Now we have the proto available in the `dist` directory, and we can use it in our application.

17. **Update the `main.ts` file in `user-service`**

18. **Getting Started with Pino**
    To set up Pino for logging in your NestJS application, follow these steps:

<https://sagarvaghela.medium.com/nestjs-logging-pino-correlation-id-and-gcp-cloud-logging-90a7e6c13a8d>

19. **NestJS to postgres database with TypeORM**

```bash
pnpm install @nestjs/typeorm typeorm pg
```
