export enum MarketType {
  CRYPTO = 'CRYPTO',
  FOREX = 'FOREX',
}

export enum TradeType {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export interface Market {
  id: string;
  symbol: string;
  name: string;
  type: MarketType;
  price: number;
  change24h: number;
  volume24h: number;
}

export interface Position {
  id: string;
  marketId: string;
  type: TradeType;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  pnlPercentage: number;
  openedAt: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  balance: number;
  xp: number;
  level: string;
  nextLevelXp: number;
  avatarUrl: string;
  role: 'LITE' | 'PRO' | 'ADMIN';
}
