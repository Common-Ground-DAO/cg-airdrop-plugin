import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { parse } from "csv-parse/browser/esm";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useDeployContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatEther } from "viem";
import { ethers } from "ethers";
import { AirdropClaim__factory } from "../types/contracts/factories/contracts/AirdropClaim__factory";

declare global {
  interface Window {
    ethereum?: any;
  }
}
// import "./maketree.css";

// Check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

// Read bytecode from contracts/artifacts/contracts/AirdropClaim.sol/AirdropClaim.json
const AIRDROP_CLAIM_BYTECODE = "0x608060405234801561001057600080fd5b5060405161098638038061098683398101604081905261002f916100d8565b6001600160a01b03821661006c5760405162461bcd60e51b815260206004820152600e60248201526d496e76616c696420616464726573730000000000000000000000000000000060508201526060015b60405180910390fd5b6000610076610082565b6100809082610183565b50506101ef565b600061008c6101d9565b905090565b634e487b7160e01b600052604160045260246000fd5b600080604083850312156100bb57600080fd5b82516001600160a01b03811681146100d257600080fd5b6020939093015192949293505050565b600080604083850312156100eb57600080fd5b82516001600160a01b038116811461010257600080fd5b602083015190925090506001600160e01b03198116811461012157600080fd5b809150509250929050565b600181811c9082168061013f57607f821691505b60208210810361015f57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156101de57600081815260208120601f850160051c8101602086101561018c5750805b601f850160051c820191505b818110156101ab5782815560010161019b565b505050505050565b601f82101561013a5760405173ffffffffffffffffffffffffffffffffffffffff7fd253900a00002e32f7f28bb7c2deda66f00c77dbf015c411f3a210cb3a03c4968301523060601b1b602583015260348201526054810191600055565b6101e761091c565b905090565b6107d8806101fe6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80637465b8f11161005b5780637465b8f11461010f578063827ba1d614610122578063a2309ff814610135578063f2fde38b1461015a57600080fd5b80634e71d92d1461008d578063715018a6146100a75780638da5cb5b146100af578063bd66528a146100fc575b600080fd5b6100a56100983661016d565b61017e565b005b6100a5610433565b6001546100c9906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b6100a561010a366004610678565b610447565b6100a561011d366004610694565b61049a565b61012a6104ae565b6040519081526020016100f3565b6100c96000805160206107858339815191525460405190815260200190565b6100a5610168366004610694565b610559565b600080600090505b600081905550919050565b600080516020610785833981519152546040516001600160a01b0383169182179182905260009161025d9060148351906020601f8401819004810282018101909252828152928492918301828280156102445780601f1061021957610100808354040283529160200191610244565b820191906000526020600020905b81548152906001019060200180831161022757829003601f168201915b5050505050610244610244610583565b6001600090815261058a565b90506001600160a01b038116331461027357600080fd5b60006001600083815260200190815260200160002060040160043373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541161030c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601860248201527f566f74696e672053746174653a20766f74652063617374000000000000000000604482015260640160405180910390fd5b60027f0000000000000000000000000000000000000000000000000000000000000000600003610430576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602360248201527f566f74696e672053746174653a20766f746520646f6573206e6f7420657869737460448201527f0000000000000000000000000000000000000000000000000000000000000000606482015260840160405180910390fd5b50565b61043b6105c1565b610445600061061c565b565b600080516020610785833981519152546001600160a01b0390811691161461043057604051630739600760e01b8152600060048201526024810183905260448101829052606401610430565b6104a98133308460405180602001604052806000815250610643565b50565b600080516020610785833981519152546000906104d790600160c01b610770565b806104e5575060011515610770565b1561053c5760405162461bcd60e51b815260206004820152602560248201527f4552433732313a20617070726f76656420717565727920666f72206e6f6e657860448201526432b73232b960d91b6064820152608401610430565b61054661064e565b91505090565b6105616105c1565b61056a8161061c565b50565b600060208284031215610580575b5090565b634e487b7160e01b600052601160045260246000fd5b604080517f3f9da809130199ffc6673d20510fc07fb1d95d1aea776477af2f7f3c5056772e6020820152908101859052600090819060608101610444565b6105c96106cf565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104455760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610430565b600080516020610785833981519152805473ffffffffffffffffffffffffffffffffffffffff8381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681179091556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b505050505050565b6000610658610656610651610571565b61012a565b5490565b905090565b600060208284031215610687575b8135610444816106eb565b600080fd5b6000602082840312156106a6576106866106eb565b813561044481610700565b8015158114610570575b50565b7f4e487b7160e01b600052604160045260246000fd5b600080516020610785833981519152546000906001600160a01b03165b905090565b80356001600160a01b03811681146106b5576106b56106c756fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60808060405234801561001057600080fd5b506004361061001e5760003560e01b5b600080fd5b6000803560e01c905060011561003b57602001351515905090565b6000505056fea2646970667358221220e148f40efb1a54be904548442f2b9419eeeb2144e94a7057bebdeedaacc68c8364736f6c634300080f0033";

function FormatUnits({value, decimals}: {value: string, decimals: number}) {
  const thousands_sep = ",";
  const decimal_sep = ".";
  if (!/^\d+$/.test(value)) {
    console.log(value);
    throw new Error("Invalid number");
  }
  if (decimals === 0) {
    return value;
  }
  let frac = value.slice(-1 * decimals);
  let int = value.slice(0, -1 * decimals);
  if (frac.length < decimals) {
    frac = frac.padStart(decimals, "0");
  }
  if (int.length < 1) {
    int = "0";
  }
  if (thousands_sep) {
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands_sep);
  }

  return (
    <div className="flex items-center font-mono justify-end">
      <div>{int}</div>
      <div>{decimal_sep}</div>
      <div className="text-xs max-w-10 overflow-x-hidden text-ellipsis">{frac}</div>
    </div>
  );
}

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex flex-col items-center">
        <p className="font-mono text-sm mb-2">Connected: {address}</p>
        <button className="btn btn-sm btn-outline" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn btn-primary"
      onClick={() => connect({ connector: injected() })}
    >
      Connect Wallet
    </button>
  );
}

// ClientOnly component to prevent hydration issues
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return <>{children}</>;
}

export default function MakeTree() {
  const [rows, setRows] = useState<[string, string][]>([]);
  const [tree, setTree] = useState<StandardMerkleTree<[string, string]> | null>(null);
  const [proofIndexMap, setProofIndexMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decimals, _setDecimals] = useState<number>(18);
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { 
    deployContract, 
    isPending, 
    isSuccess, 
    data: txHash 
  } = useDeployContract();

  // Track contract address from transaction receipt
  useEffect(() => {
    if (!isBrowser) return; // Skip on server-side

    if (isSuccess && txHash) {
      const checkReceipt = async () => {
        try {
          // Use window.ethereum to get the transaction receipt
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const receipt = await provider.getTransactionReceipt(txHash);
            if (receipt && receipt.contractAddress) {
              setContractAddress(receipt.contractAddress);
            }
          }
        } catch (err) {
          console.error("Error getting transaction receipt:", err);
        }
      };
      
      checkReceipt();
    }
  }, [isSuccess, txHash]);

  const setDecimals = useCallback((value: string) => {
    if (value === "") {
      _setDecimals(0)
    } else if (value.match(/^\d+$/)) {
      _setDecimals(parseInt(value));
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      parse(csvData, {
        columns: true,
        delimiter: ",",
        from_line: 1,
      }, (err, data) => {
        if (err) {
          setError(`Error parsing CSV: ${err.message}`);
          setLoading(false);
          return;
        }

        try {
          const treeRows = (data as { address: string, amount: string }[]).map((record) => [record.address, record.amount] as [string, string]);
          setRows(treeRows.sort((a, b) => (BigInt(b[1]) - BigInt(a[1])) > 0n ? 1 : -1));
          const tree = StandardMerkleTree.of(treeRows, ["address", "uint256"]);
          
          console.log(tree.dump());

          // Create a map of proof index to proof
          const proofIndexMap = new Map<string, number>();
          for (const [i, v] of tree.entries()) {
            proofIndexMap.set(v[0], i);
          }

          setTree(tree);
          setProofIndexMap(proofIndexMap);
        } catch (e) {
          setError(`Error generating merkle tree: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        setLoading(false);
      });
    };

    reader.readAsText(file);
  };

  const handleDeployContract = () => {
    if (!tree || !tokenAddress || !isConnected) return;

    try {
      deployContract({
        abi: AirdropClaim__factory.abi,
        bytecode: AIRDROP_CLAIM_BYTECODE as `0x${string}`,
        args: [tokenAddress as `0x${string}`, tree.root as `0x${string}`]
      });
    } catch (err) {
      setError(`Deployment error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold">Merkle Tree Generator</h1>

      <ClientOnly>
        <div className="flex flex-col items-center gap-4">
          <WalletConnect />

          <button className="btn btn-primary pointer-events-none relative">
            Upload CSV
            <input type="file" className="opacity-0 pointer-events-auto h-full w-full absolute top-0 left-0" accept=".csv" onChange={handleFileUpload} />
          </button>
        </div>
      </ClientOnly>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {tree && !loading && (<>
        {!!tree.root && (
          <>
            <h3 className="text-lg font-bold mt-4">Tree Root</h3>
            <p className="font-mono text-sm break-all max-w-[100%] overflow-auto">{tree.root}</p>

            <ClientOnly>
              {isConnected && (
                <div className="flex flex-col items-center gap-2 mt-4 w-full max-w-md">
                  <h3 className="text-lg font-bold">Deploy Airdrop Contract</h3>
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Token Address</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="0x..." 
                      className="input input-bordered w-full" 
                      value={tokenAddress} 
                      onChange={(e) => setTokenAddress(e.target.value)} 
                    />
                  </div>
                  <button 
                    className={`btn btn-primary w-full ${isPending ? 'loading' : ''}`} 
                    onClick={handleDeployContract} 
                    disabled={!tree || !tokenAddress || isPending}
                  >
                    {isPending ? 'Deploying...' : 'Deploy Airdrop Contract'}
                  </button>
                  
                  {isSuccess && txHash && (
                    <div className="alert alert-success">
                      <span>Transaction sent! Hash: </span>
                      <a 
                        href={`https://etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="link link-primary"
                      >
                        {txHash}
                      </a>
                    </div>
                  )}
                  
                  {contractAddress && (
                    <div className="alert alert-success mt-2">
                      <span>Contract deployed at: </span>
                      <a 
                        href={`https://etherscan.io/address/${contractAddress}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="link link-primary"
                      >
                        {contractAddress}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </ClientOnly>
          </>
        )}
        
        <table className="table font-mono max-w-[min(700px,100vw)] mt-4">
          <thead>
            <tr>
              <th>Address</th>
              <th>
                <div className="flex items-center gap-2">
                  <div>Amount</div>
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full max-w-12"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                  />
                </div>
              </th>
              <th>Proof</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                <td>
                  {row[0]}
                </td>
                <td>
                  <FormatUnits value={row[1]} decimals={decimals} />
                </td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => {
                    const index = proofIndexMap.get(row[0]);
                    if (!!tree && index !== undefined) {
                      const proof = tree.getProof(index);
                      console.log(`Proof for address ${row[0]}, amount ${row[1]}:`);
                      console.log(proof);
                    }
                  }}>
                    Proof
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>)}
    </div>
  );
}