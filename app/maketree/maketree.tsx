import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { parse } from "csv-parse/browser/esm";
import { useCallback, useState } from "react";
// import "./maketree.css";

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

export default function MakeTree() {
  const [rows, setRows] = useState<[string, string][]>([]);
  const [tree, setTree] = useState<StandardMerkleTree<[string, string]> | null>(null);
  const [proofIndexMap, setProofIndexMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decimals, _setDecimals] = useState<number>(18);

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
      const records = parse(csvData, {
        columns: true,
        delimiter: ",",
        from_line: 1,
      }, (err, data) => {
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
      });

      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen">
      <h1 className="text-2xl font-bold">Merkle Tree Generator</h1>

      <button className="btn btn-primary pointer-events-none relative">
        Upload CSV
        <input type="file" className="opacity-0 pointer-events-auto h-full w-full absolute top-0 left-0" accept=".csv" onChange={handleFileUpload} />
      </button>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {tree && !loading && (<>
        {!!tree.root && <><h3 className="text-lg font-bold mt-4">Tree Root</h3><p>{tree.root}</p></>}
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

