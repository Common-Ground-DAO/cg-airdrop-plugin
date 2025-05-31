import CsvUploadButton, { type CsvUploadResult } from "../../csv-upload-button/csv-upload-button";
import FormatUnits from "../../format-units/format-units";
import type { AirdropData } from "../airdrop-create";
import TokenMetadataDisplay from "~/components/token-metadata-display";

interface StepTwoProps {
  csvResult: CsvUploadResult | null;
  setCsvResult: React.Dispatch<React.SetStateAction<CsvUploadResult | null>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  airdropData: AirdropData;
}

const AirdropSetupStepTwo = ({ csvResult, setCsvResult, setStep, airdropData }: StepTwoProps) => {
  return <div className="h-full flex flex-col items-center">
    <div className="flex flex-col mb-4 items-center max-w-md">
      {!csvResult && <>
        <p>Upload a CSV file to get started. It must contain address and uint256 values and has to be formatted like this:</p>
        <div className="card font-mono p-2 my-4 bg-white text-black text-sm whitespace-nowrap">
          "address","amount"<br />
          "0x1234567890123456789012345678901234567890","100"<br />
          "0x1234567890123456789012345678901234567891","200"
        </div>
      </>}
      {!!csvResult && <p>CSV upload successful.</p>}
    </div>

    {!!csvResult && (
      <div className="flex-1 overflow-auto mb-4 bg-white rounded-lg border border-base-300">
        <table className="table w-full font-mono text-black text-xs">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="p-2 border-b">Address</th>
              <th className="p-2 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {csvResult.rows.map((row, index) => (
              <tr key={index}>
                <td className={`p-2 ${index === csvResult.rows.length - 1 ? "" : "border-b"}`}>
                  {row[0]}
                </td>
                <td className={`p-2 ${index === csvResult.rows.length - 1 ? "" : "border-b"}`}>
                  <FormatUnits value={row[1]} decimals={airdropData.tokenData?.decimals || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div className="flex flex-col items-center gap-2 mt-auto">
      <TokenMetadataDisplay tokenData={airdropData.tokenData} />
      <div className="flex flex-row gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setStep(0)}
        >Back</button>
        <CsvUploadButton
          text={`Upload${!!csvResult ? " new" : ""} CSV`}
          onUpload={setCsvResult}
        />
        <button
          className="btn btn-primary"
          onClick={() => setStep(2)}
          disabled={!csvResult}
        >Next</button>
      </div>
    </div>
  </div>;
};

export default AirdropSetupStepTwo;