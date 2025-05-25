const TokenInfo = ({ tokenName, tokenSymbol, decimals }: { tokenName?: string, tokenSymbol?: string, decimals?: number }) => {
    return <div className="flex flex-row gap-4 text-xs text-gray-500">
        <span>Name: {tokenName || "-"}</span>
        <span>Symbol: {tokenSymbol || "-"}</span>
        <span>Decimals: {decimals || "-"}</span>
    </div>;
};

export default TokenInfo;