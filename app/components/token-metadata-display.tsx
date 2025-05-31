import type { TokenData } from "~/hooks/token-data";

interface TokenMetadataDisplayProps {   
    tokenData?: TokenData;
}

export default function TokenMetadataDisplay({ tokenData }: TokenMetadataDisplayProps) {
    if (!tokenData) {
        return <div className="p-4 text-gray-500">No contract data provided</div>;
    }

    if (tokenData.isFetching) {
        return (
            <div className="p-4 space-y-2">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="text-sm text-gray-500">Loading token metadata...</div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">
                    {tokenData.type === "erc20" ? tokenData.erc20Data?.name : tokenData.lsp7Data?.lsp4TokenName}
                    <div className={`badge ${tokenData.type === "lsp7" ? 'badge-primary' : 'badge-secondary'}`}>
                        {tokenData.type === "lsp7" ? 'LSP7' : 'ERC20'}
                    </div>
                </h2>
                
                <div className="space-y-3">
                    {/* Basic Token Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Symbol</label>
                            <div className="text-lg font-mono">{tokenData.type === "lsp7" ? tokenData.lsp7Data?.lsp4TokenSymbol : tokenData.erc20Data?.symbol}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Decimals</label>
                            <div className="text-lg">{tokenData.decimals ?? 'N/A'}</div>
                        </div>
                    </div>

                    {tokenData.totalSupply && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Total Supply</label>
                            <div className="text-lg font-mono">
                                {tokenData.decimals !== undefined && (
                                    <span className="text-sm text-gray-500 ml-2">
                                        ({((tokenData.totalSupply || 0n) / (10n ** BigInt(tokenData.decimals || 0))).toLocaleString()} {tokenData.type === "lsp7" ? tokenData.lsp7Data?.lsp4TokenSymbol : tokenData.erc20Data?.symbol})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LSP7 Specific Information */}
                    {tokenData.type === "lsp7" && (
                        <div className="divider">LSP4 Digital Asset Metadata</div>
                    )}

                    {tokenData.type === "lsp7" && tokenData.lsp7Data?.lsp4TokenType !== undefined && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">LSP4 Token Type</label>
                            <div className="text-lg">
                                {tokenData.lsp7Data?.lsp4TokenType === 0 && <span className="badge badge-success">Token</span>}
                                {tokenData.lsp7Data?.lsp4TokenType === 1 && <span className="badge badge-warning">NFT</span>}
                                {tokenData.lsp7Data?.lsp4TokenType === 2 && <span className="badge badge-info">Collection</span>}
                                {tokenData.lsp7Data?.lsp4TokenType > 2 && <span className="badge badge-neutral">Custom ({tokenData.lsp7Data?.lsp4TokenType})</span>}
                            </div>
                        </div>
                    )}

                    {tokenData.type === "lsp7" && tokenData.lsp7Data?.lsp4Creators && tokenData.lsp7Data?.lsp4Creators.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Creators</label>
                            <div className="space-y-1">
                                {tokenData.lsp7Data?.lsp4Creators.map((creator, index) => (
                                    <div key={index} className="text-sm font-mono bg-base-200 p-2 rounded">
                                        {creator}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tokenData.type === "lsp7" && tokenData.lsp7Data?.lsp4Metadata && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Metadata</label>
                            <div className="collapse collapse-arrow bg-base-200">
                                <input type="checkbox" />
                                <div className="collapse-title text-sm font-medium">
                                    View JSON Metadata
                                </div>
                                <div className="collapse-content">
                                    <pre className="text-xs overflow-auto max-h-64">
                                        {JSON.stringify(tokenData.lsp7Data?.lsp4Metadata, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Debug Information */}
                    {(tokenData.error || tokenData.lsp7Data?.errors?.otherError) && (
                        <div className="alert alert-error">
                            <span className="text-sm">
                                {tokenData.error?.message || tokenData.lsp7Data?.errors?.otherError}
                            </span>
                        </div>
                    )}

                    {/* Raw LSP4 Data (for debugging) */}
                    {tokenData.type === "lsp7" && import.meta.env.DEV && (
                        <details className="collapse bg-base-200">
                            <summary className="collapse-title text-sm">Debug: Raw LSP4 Data</summary>
                            <div className="collapse-content space-y-2 text-xs">
                                <div><strong>Name Data:</strong> {tokenData.lsp7Data?.lsp4TokenName}</div>
                                <div><strong>Symbol Data:</strong> {tokenData.lsp7Data?.lsp4TokenSymbol}</div>
                                <div><strong>Type Data:</strong> {tokenData.lsp7Data?.lsp4TokenType}</div>
                                {/*<div><strong>Metadata Data:</strong> {tokenData.lsp7Data?.lsp4Metadata}</div>
                                <div><strong>Creators Data:</strong> {tokenData.lsp7Data?.lsp4Creators}</div>*/}
                            </div>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );
} 