import { create } from 'zustand';

export type TxStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed';
export type TxType = 'Deposit' | 'Withdrawal';

export type TxMethod = 'Credit Card' | 'IBAN Transfer' | 'Payment Link' | 'Crypto (USDT)' | 'Other';

export const TX_METHODS: TxMethod[] = ['Credit Card', 'IBAN Transfer', 'Payment Link', 'Other'];

export interface TxRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: TxType;
  method?: TxMethod;
  instructions?: string;
  amount: number;
  currency: string;
  status: TxStatus;
  date: string;
}

export interface AdminNotification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

interface TransactionState {
  requests: TxRequest[];
  notifications: AdminNotification[];
  addRequest: (req: Omit<TxRequest, 'id' | 'date' | 'status'>) => string;
  updateRequestStatus: (id: string, status: TxStatus) => void;
  updateRequestInstructions: (id: string, instructions: string) => void;
  addNotification: (message: string) => void;
  markNotificationRead: (id: string) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  requests: [],
  notifications: [],
  addRequest: (reqData) => {
    const id = crypto.randomUUID();
    set((state) => {
      const newReq: TxRequest = {
        ...reqData,
        id,
        date: new Date().toISOString(),
        status: 'Pending',
      };

      const notifMsg = `New ${newReq.type.toLowerCase()} request from ${newReq.userName} — ${newReq.amount} ${newReq.currency}`;
      const newNotif: AdminNotification = {
        id: crypto.randomUUID(),
        message: notifMsg,
        date: new Date().toISOString(),
        read: false,
      };

      return {
        requests: [newReq, ...state.requests],
        notifications: [newNotif, ...state.notifications]
      };
    });
    return id;
  },
  updateRequestStatus: (id, status) => set((state) => {
    const newReqs = state.requests.map(r => r.id === id ? { ...r, status } : r);
    return { requests: newReqs };
  }),
  updateRequestInstructions: (id, instructions) => set((state) => {
    const newReqs = state.requests.map(r => r.id === id ? { ...r, instructions } : r);
    return { requests: newReqs };
  }),
  addNotification: (message) => set((state) => ({
    notifications: [{
      id: crypto.randomUUID(),
      message,
      date: new Date().toISOString(),
      read: false
    }, ...state.notifications]
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  }))
}));
