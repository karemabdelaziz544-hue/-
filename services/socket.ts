import { io, Socket } from "socket.io-client";
import { api } from "./api";

// For Preview/Demo purposes, we can toggle this. 
// If you run the backend, set this to FALSE or check api.isMock()
const USE_MOCK_SOCKET = api.isMock(); 

let socket: Socket | null = null;

// Mock Socket Implementation for the Preview Environment
class MockSocket {
  listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this;
  }

  emit(event: string, data: any) {
    console.log(`[MockSocket] Emitting ${event}:`, data);
    
    if (event === 'join') {
      // Simulate successful join
    }
    
    if (event === 'send_message') {
      // Simulate echo back to sender for UI update logic
      // In a real app, we might listen to 'message_sent'
      // We also need to simulate the receiver getting it.
      // For simple state updates, DataContext handles the "optimistic" update for the sender.
      
      // If we wanted to simulate receiving a reply from the "bot" or admin:
      // setTimeout(() => {
      //   this.trigger('receive_message', { ...fakeReply });
      // }, 1000);
    }
  }

  off(event: string) {
    delete this.listeners[event];
  }

  // Helper to trigger events from the "server"
  trigger(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  disconnect() {
    this.listeners = {};
  }
}

const mockSocketInstance = new MockSocket();

export const socketService = {
  connect: (token: string) => {
    if (USE_MOCK_SOCKET) {
      console.log("SocketService: Connected (Mock)");
      return mockSocketInstance;
    }

    if (!socket) {
      socket = io('http://localhost:5000', {
        auth: { token }
      });
    }
    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  
  // Allow triggering mock events for testing
  mockReceive: (event: string, data: any) => {
    if(USE_MOCK_SOCKET) mockSocketInstance.trigger(event, data);
  }
};
