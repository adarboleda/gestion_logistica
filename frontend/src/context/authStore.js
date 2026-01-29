import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      // Estado
      user: null,
      token: null,
      isAuthenticated: false,

      // Acciones
      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },

      // Verificar si el usuario tiene un rol específico
      hasRole: (roles) => {
        const { user } = useAuthStore.getState();
        if (!user) return false;
        if (Array.isArray(roles)) {
          return roles.includes(user.rol);
        }
        return user.rol === roles;
      },

      // Verificar si es admin
      isAdmin: () => {
        const { user } = useAuthStore.getState();
        return user?.rol === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
