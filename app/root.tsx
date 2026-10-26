import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { WagmiProvider, fallback, http, type Transport } from 'wagmi';
import {
  mainnet,
  base,
  bsc,
  arbitrum,
  arbitrumNova,
  avalanche,
  celo,
  fantom,
  gnosis,
  linea,
  lukso,
  luksoTestnet,
  optimism,
  polygon,
  polygonZkEvm,
  scroll,
  sepolia,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import "./app.css";
import { CgPluginLibProvider } from "./context/plugin_lib";
import { CgDataProvider } from "./context/cg_data";
import { WindowSizeProvider } from "./context/window_size";

const theme = "silk";

// Define local HardHat network
const hardhat = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
} as const;

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

const queryClient = new QueryClient();

const chains = [
  hardhat,
  mainnet,
  base,
  bsc,
  arbitrum,
  arbitrumNova,
  avalanche,
  celo,
  fantom,
  gnosis,
  linea,
  lukso,
  luksoTestnet,
  optimism,
  polygon,
  polygonZkEvm,
  scroll,
  sepolia,
] as const;

// viem's default mainnet RPC (eth.merkle.io) is heavily rate limited and its
// 429 responses carry no CORS headers, so use our own RPC with public fallbacks.
const mainnetRpcUrls = [
  import.meta.env.VITE_MAINNET_RPC_URL,
  'https://ethereum-rpc.publicnode.com',
].filter((url): url is string => !!url);

const transports = Object.fromEntries(
  chains.map((chain) => [
    chain.id,
    chain.id === mainnet.id
      ? fallback([...mainnetRpcUrls.map((url) => http(url)), http()])
      : http(),
  ])
) as Record<(typeof chains)[number]['id'], Transport>;

// Create RainbowKit config with all your existing chains
const config = getDefaultConfig({
  appName: 'CG Airdrop Plugin',
  projectId: '98aff99263d5c1f65f8fbc5c7f890f96', // You can get a proper WalletConnect project ID from https://cloud.walletconnect.com
  chains,
  transports,
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <WindowSizeProvider>
      <CgPluginLibProvider>
        <CgDataProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                <div className="w-[100vw] h-[100vh] max-w-[100vw] max-h-[100vh] overflow-hidden bg-base-200 p-0 m-0" data-theme={theme}>
                  <Outlet />
                </div>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </CgDataProvider>
      </CgPluginLibProvider>
    </WindowSizeProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
