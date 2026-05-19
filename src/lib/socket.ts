import { io, Socket } from 'socket.io-client';

// Use the API URL from env, or default to the local backend port
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinUserRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('join_user', userId);
    }
  }

  joinMahberRoom(mahberId: string) {
    if (this.socket) {
      this.socket.emit('join_mahber', mahberId);
    }
  }

  leaveMahberRoom(mahberId: string) {
    if (this.socket) {
      this.socket.emit('leave_mahber', mahberId);
    }
  }
}

export const socketService = new SocketService();
