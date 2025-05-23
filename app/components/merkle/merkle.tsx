// types for later imports, to improve code splitting
import type { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { AirdropClaim__factory } from "../../contracts/factories/contracts/AirdropClaim__factory";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useDeployContract, useReadContract } from "wagmi";
import { useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";

declare global {
  interface Window {
    ethereum?: any;
  }
}
// import "./maketree.css";

// Check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

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
      <div className="max-w-10 overflow-x-hidden text-ellipsis">{frac}</div>
    </div>
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
  const [abi, setAbi] = useState<typeof AirdropClaim__factory.abi | null>(null);
  const { userInfo, communityInfo } = useCgData();
  const submit = useSubmit();

  const handleCreateAirdrop = useCallback(() => {
    if (!communityInfo || !userInfo) return;
    
    const formData = new FormData();
    formData.append("name", "Test Airdrop");
    formData.append("creatorId", userInfo.id);
    formData.append("communityId", communityInfo.id);
    formData.append("contract", "0x0000000000000000000000000000000000000000");
    formData.append("items", JSON.stringify([
      {
        address: "0x0000000000000000000000000000000000000000",
        amount: "100",
      }, 
      {
        address: "0x0000000000000000000000000000000000000001",
        amount: "200",
      }
    ]));

    submit(formData, { method: "post", action: "/api/airdrops", navigate: false });
  }, [communityInfo, userInfo, submit]);

  const { address, isConnected } = useAccount();
  const { 
    deployContract, 
    isPending, 
    isSuccess, 
    data: txHash 
  } = useDeployContract();

  const getAirdropClaimFactory = async () => {
    const { AirdropClaim__factory } = await import("../../contracts/factories/contracts/AirdropClaim__factory");
    return AirdropClaim__factory;
  }

  useEffect(() => {
    if (isBrowser) {
      getAirdropClaimFactory().then(factory => setAbi(factory.abi));
    }
  }, [isBrowser]);
  
  const { data: hasClaimed } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: abi || [],
    functionName: "hasClaimed",
    args: [address as `0x${string}`],
  });
  
  // Track contract address from transaction receipt
  useEffect(() => {
    if (!isBrowser) return; // Skip on server-side

    if (isSuccess && txHash) {
      const checkReceipt = async () => {
        try {
          // Use window.ethereum to get the transaction receipt
          if (window.ethereum) {
            const { BrowserProvider } = await import("ethers");
            const provider = new BrowserProvider(window.ethereum);
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
      const { parse } = await import("csv-parse/browser/esm");
      parse(csvData, {
        columns: true,
        delimiter: ",",
        from_line: 1,
      }, async (err, data) => {
        if (err) {
          setError(`Error parsing CSV: ${err.message}`);
          setLoading(false);
          return;
        }

        try {
          const { StandardMerkleTree } = await import("@openzeppelin/merkle-tree");
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

  const handleDeployContract = async () => {
    if (!tree || !tokenAddress || !isConnected) return;
    const factory = await getAirdropClaimFactory();

    try {
      deployContract({
        abi: factory.abi,
        bytecode: factory.bytecode,
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