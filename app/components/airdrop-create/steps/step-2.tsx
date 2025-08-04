import { useMemo } from "react";
import CsvUploadButton, { type CsvUploadResult } from "../../csv-upload-button/csv-upload-button";
import FormatUnits from "../../format-units/format-units";
import type { AirdropData } from "../airdrop-create";

interface StepTwoProps {
  csvResult: CsvUploadResult | null;
  setCsvResult: React.Dispatch<React.SetStateAction<CsvUploadResult | null>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  airdropData: AirdropData;
}

const AirdropSetupStepTwo = ({ csvResult, setCsvResult, setStep, airdropData }: StepTwoProps) => {
  const decimals = airdropData.tokenData?.decimals;

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
      {!!csvResult && typeof decimals === "number" && <>
        <div>Upload successful!</div>
        <div className="flex flex-row items-center gap-2">
          <span>Total airdrop:</span>
          <FormatUnits decimals={decimals} value={csvResult.totalAmount.toString()} />
        </div>
      </>}
    </div>

    {!!csvResult && (
      <div className="flex flex-col items-center flex-1 overflow-auto w-full max-w-full mb-4">
        <div className="flex flex-col items-center max-w-full w-fit bg-white rounded-lg border border-base-300 p-2 pt-0 shadow-lg mb-4">
          <table className="table mx-auto font-mono text-black text-xs w-fit">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="p-2 pt-4 border-b">Address</th>
                <th className="p-2 pt-4 border-b">Amount</th>
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
      </div>
    )}

    <div className="flex flex-col items-center gap-2 mt-auto mb-4">
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