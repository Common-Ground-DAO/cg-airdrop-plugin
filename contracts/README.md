# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

## Deployment

To deploy the mock contracts (MockToken and MockLSP7) to your local Hardhat network, run:

```
npm run hardhat:deploy
```

This will deploy both contracts and print their addresses to the console.
