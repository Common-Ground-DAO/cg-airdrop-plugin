import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { parse } from "csv-parse/browser/esm";
import { useState } from "react";

export default function LoadTree() {
  const [tree, setTree] = useState<StandardMerkleTree<[string, string]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const treeData = (data as { address: string, amount: string }[]).map((record) => [record.address, record.amount] as [string, string]);
        const tree = StandardMerkleTree.of(treeData, ["address", "uint256"]);
        setTree(tree);
        console.log(tree.dump());
      });

      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Merkle Tree Generator</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {tree && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Merkle Tree</h2>
          <pre className="mt-2 p-4 bg-gray-100 rounded-md">
            Wait...
          </pre>
        </div>
      )}
    </div>
  );
}

