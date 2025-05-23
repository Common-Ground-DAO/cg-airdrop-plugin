# CG Airdrop Plugin

A web application for creating and managing token airdrops with merkle tree distribution. Upload CSV files with recipient addresses and amounts, generate merkle trees, deploy smart contracts, and manage airdrop data.

## Features

- **CSV Upload**: Upload recipient lists with addresses and token amounts
- **Merkle Tree Generation**: Generate cryptographic merkle trees for efficient airdrop distribution
- **Smart Contract Deployment**: Deploy AirdropClaim contracts with merkle root verification
- **Wallet Integration**: Connect MetaMask or other Web3 wallets using wagmi
- **Database Management**: Store and manage airdrop metadata with Prisma and SQLite
- **API Routes**: RESTful API endpoints for airdrop operations

## Tech Stack

- **Frontend**: React 19, React Router 7, TypeScript, TailwindCSS, DaisyUI
- **Backend**: React Router 7 API routes, Prisma ORM, SQLite
- **Blockchain**: Hardhat, ethers.js, wagmi, viem, OpenZeppelin contracts
- **Build**: Vite, TypeScript

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Contract Types
```bash
npm run generate-types
```
This compiles Solidity contracts and generates TypeScript types.

### 3. Setup Database
```bash
npm run prisma:migrate
```
This creates the SQLite database and applies migrations.

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```
This generates the Prisma client for database operations.

### 5. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

## Available Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking

### Smart Contracts
- `npm run compile-contracts` - Compile Solidity contracts with Hardhat
- `npm run generate-types` - Compile contracts and generate TypeScript types

### Database
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create and apply new migration
- `npm run prisma:reset` - Reset database and reapply all migrations
- `npm run prisma:deploy` - Apply pending migrations (production)
- `npm run prisma:studio` - Open Prisma Studio GUI at `http://localhost:5555`
- `npm run db:seed` - Run database seeds

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your Web3 wallet
2. **Upload CSV**: Upload a CSV file with columns `address` and `amount`
3. **Generate Tree**: The app automatically generates a merkle tree from your data
4. **Deploy Contract**: Enter a token contract address and deploy the AirdropClaim contract
5. **Manage Airdrops**: Use the API to create and manage airdrop records in the database

## CSV Format

Your CSV file should have these columns:
```csv
address,amount
0x1234567890123456789012345678901234567890,1000000000000000000
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,500000000000000000
```

Amounts should be in wei (smallest token unit).

## Smart Contracts

- **AirdropClaim.sol**: Main contract for token distribution using merkle proofs
- **MockToken.sol**: ERC20 token for testing

Recipients can claim tokens by providing their merkle proof to the deployed contract.

## API Endpoints

- `POST /api/airdrops` - Create new airdrop record

## Project Structure

```
├── app/                 # React Router 7 application
│   ├── routes/         # Route handlers and API endpoints
│   ├── maketree/       # Merkle tree generation UI
│   └── menu/           # Navigation components
├── contracts/          # Solidity smart contracts
├── prisma/             # Database schema and migrations
└── generated/          # Generated Prisma client and contract types
```

## Available Scripts

- `npm run dev` - Start the development server with HMR
- `npm run build`