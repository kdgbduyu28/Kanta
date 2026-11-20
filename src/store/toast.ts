import { create } from 'zustand';

type ToastState = { message: string | null; id: number; show: (m: string) => void; hide: () => void };

export const useToast = create<ToastState>((set, get) => ({
  message: null,
  id: 0,
  show: (message) => {
    const id = get().id + 1;
    set({ message, id });
    setTimeout(() => {
      if (get().id === id) set({ message: null });
    }, 2800);
  },
  hide: () => set({ message: null }),
}));

export const toast = (m: string) => useToast.getState().show(m);
