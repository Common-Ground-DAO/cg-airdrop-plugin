import type { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { useState } from "react";

export interface CsvUploadResult {
  rows: [string, string][];
  tree: StandardMerkleTree<[string, string]>;
}

interface CsvUploadButtonProps {
  text: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onUpload: (result: CsvUploadResult) => void;
}

export default function CsvUploadButton({ text, icon, className, disabled, onUpload }: CsvUploadButtonProps) {
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
          const rows = treeRows.sort((a, b) => (BigInt(b[1]) - BigInt(a[1])) > 0n ? 1 : -1);
          const tree = StandardMerkleTree.of(rows, ["address", "uint256"]);

          onUpload({ rows, tree });
        } catch (e) {
          setError(`Error generating merkle tree: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          setLoading(false);
        }
      });
    };

    reader.readAsText(file);
  };

  return <div className="flex flex-col items-center cursor-pointer">
    <button
      className={`btn btn-primary pointer-events-none relative ${className || ""}`}
      disabled={loading || disabled}
    >
      {text}
      <input
        type="file"
        className="opacity-0 pointer-events-auto h-full w-full absolute top-0 left-0"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={loading || disabled}
      />
    </button>
  </div>;
}