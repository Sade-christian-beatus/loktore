import { io } from 'socket.io-client'
import { api } from './api.js'

// Connexion Socket.IO unique, authentifiée par le jeton d'accès.
// En dev, le proxy Vite redirige /socket.io vers l'API :4000.
let socket = null

export function getSocket() {
  if (!socket) {
    socket = io({
      auth: { token: api.getToken() },
      autoConnect: true,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
