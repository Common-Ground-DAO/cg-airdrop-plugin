const thousands_sep_regex = /\B(?=(\d{3})+(?!\d))/g;

export default function FormatUnits({value, decimals, className}: {value: string, decimals: number, className?: string}) {
    const thousands_sep = ",";
    const decimal_sep = ".";
    if (!/^\d+$/.test(value)) {
      console.error("Invalid value: Must be a string of digits", value);
      return <div className="text-red-500">Invalid number format</div>;
    }
    if (typeof decimals !== "number" || decimals < 0 || Math.floor(decimals) !== decimals) {
      console.error("Invalid decimals: Must be an integer and greater than -1", decimals);
      return <div className="text-red-500">Invalid decimals</div>;
    }
    if (decimals > 18) {
      console.warn(`Uncommon decimals: Most ERC20 tokens have up to 18 decimals, but this token has ${decimals} decimals`);
    }
    if (decimals === 0) {
      return value.replace(thousands_sep_regex, thousands_sep);
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
      int = int.replace(thousands_sep_regex, thousands_sep);
    }
  
    return (
      <div className={className}>
        <div className="flex items-center font-mono justify-end">
          <div>{int}</div>
          <div>{decimal_sep}</div>
          <div className="max-w-14 overflow-x-hidden text-ellipsis">{frac}</div>
        </div>
      </div>
    );
  }