import { BrowserProvider, Contract, parseUnits } from 'ethers';

export const ETHEREUM_MAINNET_CHAIN_ID = '0x1';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

function getEthereumProvider(): any {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('MetaMask is not installed. Install the MetaMask browser extension to continue.');
  return eth;
}

export function isMetaMaskAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).ethereum);
}

/** Prompts MetaMask's account-selection popup and returns the connected address. */
export async function connectMetaMask(): Promise<string> {
  const eth = getEthereumProvider();
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  if (!accounts?.[0]) throw new Error('No account was authorized in MetaMask.');
  return accounts[0];
}

/** Reads the currently-connected account without prompting a popup (empty if not connected). */
export async function getConnectedAccount(): Promise<string | null> {
  if (!isMetaMaskAvailable()) return null;
  const eth = getEthereumProvider();
  const accounts: string[] = await eth.request({ method: 'eth_accounts' });
  return accounts?.[0] ?? null;
}

export async function getChainId(): Promise<string> {
  const eth = getEthereumProvider();
  return eth.request({ method: 'eth_chainId' });
}

/** Prompts a network switch if MetaMask isn't already on Ethereum Mainnet. */
export async function ensureEthereumMainnet(): Promise<void> {
  const eth = getEthereumProvider();
  const chainId: string = await eth.request({ method: 'eth_chainId' });
  if (chainId === ETHEREUM_MAINNET_CHAIN_ID) return;
  await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ETHEREUM_MAINNET_CHAIN_ID }] });
}

/**
 * Sends an ERC20 `transfer` from the connected MetaMask account. Returns the
 * broadcast transaction hash immediately (does not wait for confirmations —
 * the platform's deposit flow records the hash for manual admin review, it
 * does not credit the balance itself).
 */
export async function sendUsdtTransfer(params: {
  tokenContract: string;
  tokenDecimals: number;
  toAddress: string;
  amountHuman: number;
}): Promise<{ txHash: string; fromAddress: string }> {
  const eth = getEthereumProvider();
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const fromAddress = await signer.getAddress();

  const contract = new Contract(params.tokenContract, ERC20_ABI, signer);
  const amountUnits = parseUnits(params.amountHuman.toFixed(params.tokenDecimals), params.tokenDecimals);

  const tx = await contract.transfer(params.toAddress, amountUnits);
  return { txHash: tx.hash, fromAddress };
}
