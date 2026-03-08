import { create } from 'zustand';
import api from '../api/axios';

const useCartStore = create((set, get) => ({
  cart: { items: [], billing: { subtotal: 0, cgst_amount: 0, sgst_amount: 0, delivery_charge: 0, total: 0 } },
  loading: false,
  error: null,
  deliveryCharge: 0,
  distance: 0,

  fetchCart: async (deliveryCharge = 0) => {
    set({ loading: true });
    try {
      const response = await api.get(`/cart/?delivery_charge=${deliveryCharge}`);
      set({ cart: response.data, loading: false, deliveryCharge });
    } catch (error) {
      set({ error: 'Failed to fetch cart', loading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ loading: true });
    try {
      const charge = get().deliveryCharge;
      const response = await api.post(`/cart/add/?delivery_charge=${charge}`, { product_id: productId, quantity, delivery_charge: charge });
      set({ cart: response.data.cart, loading: false });
    } catch (error) {
      set({ error: 'Failed to add item', loading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ loading: true });
    try {
      const charge = get().deliveryCharge;
      const response = await api.patch(`/cart/items/${itemId}/?delivery_charge=${charge}`, { quantity, delivery_charge: charge });
      set({ cart: response.data.cart, loading: false });
    } catch (error) {
      set({ error: 'Failed to update item', loading: false });
    }
  },

  removeItem: async (itemId) => {
    set({ loading: true });
    try {
      const charge = get().deliveryCharge;
      const response = await api.delete(`/cart/items/${itemId}/remove/?delivery_charge=${charge}`);
      set({ cart: response.data.cart, loading: false });
    } catch (error) {
      set({ error: 'Failed to remove item', loading: false });
    }
  },

  clearCart: async () => {
    set({ loading: true });
    try {
      const response = await api.delete('/cart/clear/');
      set({ cart: response.data.cart, loading: false });
    } catch (error) {
      set({ error: 'Failed to clear cart', loading: false });
    }
  },

  calculateDelivery: async (lat, lng) => {
    try {
      console.log('Calculating delivery for:', lat, lng);
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        console.warn('Invalid coordinates:', lat, lng);
        return null;
      }

      const fixedLat = parseFloat(parsedLat.toFixed(6));
      const fixedLng = parseFloat(parsedLng.toFixed(6));
      console.log('Fixed coords:', fixedLat, fixedLng);
      const response = await api.post('/products/calculate-delivery/', { latitude: fixedLat, longitude: fixedLng });
      const { delivery_charge, distance_km } = response.data;
      set({ deliveryCharge: delivery_charge, distance: distance_km });
      get().fetchCart(delivery_charge);
      return { delivery_charge, distance_km };
    } catch (error) {
      console.error('Delivery calculation failed', error);
      return null;
    }
  }
}));

export default useCartStore;
