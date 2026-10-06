export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: 'LITE' | 'PRO' | 'ADMIN'
          kyc_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'LITE' | 'PRO' | 'ADMIN'
          kyc_status?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'LITE' | 'PRO' | 'ADMIN'
          kyc_status?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          realized_pnl: number
          margin_used: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          realized_pnl?: number
          margin_used?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          realized_pnl?: number
          margin_used?: number
          currency?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: 'Long' | 'Short'
          entry_price: number
          size: number
          leverage: number
          margin_type: 'Cross' | 'Isolated'
          margin: number
          liquidation_price: number
          stop_loss: number | null
          take_profit: number | null
          status: 'open' | 'closed'
          opened_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: 'Long' | 'Short'
          entry_price: number
          size: number
          leverage: number
          margin_type?: 'Cross' | 'Isolated'
          margin: number
          liquidation_price: number
          stop_loss?: number | null
          take_profit?: number | null
          status?: 'open' | 'closed'
          opened_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          type?: 'Long' | 'Short'
          entry_price?: number
          size?: number
          leverage?: number
          margin_type?: 'Cross' | 'Isolated'
          margin?: number
          liquidation_price?: number
          stop_loss?: number | null
          take_profit?: number | null
          status?: 'open' | 'closed'
          closed_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: 'Market' | 'Limit' | 'Stop'
          position_type: 'Long' | 'Short'
          price: number
          size: number
          leverage: number
          margin_type: 'Cross' | 'Isolated'
          stop_loss: number | null
          take_profit: number | null
          status: 'pending' | 'filled' | 'canceled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: 'Market' | 'Limit' | 'Stop'
          position_type: 'Long' | 'Short'
          price: number
          size: number
          leverage: number
          margin_type?: 'Cross' | 'Isolated'
          stop_loss?: number | null
          take_profit?: number | null
          status?: 'pending' | 'filled' | 'canceled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'filled' | 'canceled'
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'PNL'
          amount: number
          asset: string
          status: 'PENDING' | 'COMPLETED' | 'FAILED'
          tx_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'PNL'
          amount: number
          asset?: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED'
          tx_hash?: string | null
          created_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'disabled' | 'draft'
          trigger: string | null
          trigger_type: string | null
          trigger_config: Json
          conditions: Json
          actions: Json
          created_by: string | null
          workspace_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'disabled' | 'draft'
          trigger?: string | null
          trigger_type?: string | null
          trigger_config?: Json
          conditions?: Json
          actions?: Json
          created_by?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'active' | 'disabled' | 'draft'
          trigger?: string | null
          trigger_type?: string | null
          trigger_config?: Json
          conditions?: Json
          actions?: Json
          created_by?: string | null
          workspace_id?: string | null
          updated_at?: string
        }
      }
      gamification_profiles: {
        Row: {
          user_id: string
          xp: number
          level: number
          rank: string
          achievements: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          xp?: number
          level?: number
          rank?: string
          achievements?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
