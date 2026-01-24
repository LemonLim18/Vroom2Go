import { io } from 'socket.io-client';
import { BACKEND_URL } from './api';

const URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket']
});
