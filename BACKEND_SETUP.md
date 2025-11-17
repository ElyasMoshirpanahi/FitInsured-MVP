# Required Dependencies for FitInsured Backend

Run these commands to install the necessary dependencies:

## Runtime Dependencies
npm install express cors mongoose bcryptjs

## Development/Type Dependencies
npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs

## Initialize TypeScript if not already done
npm install -D ts-node

## Optional: If you want to use the uuid package instead of crypto.randomUUID()
npm install uuid
npm install -D @types/uuid