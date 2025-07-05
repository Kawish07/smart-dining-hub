// lib/kitchen-sse.js

const clients = new Set();

export const addClient = (client) => {
  clients.add(client);
};

export const removeClient = (client) => {
  clients.delete(client);
};

export const broadcastUpdate = (order) => {
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(order)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting update:', error);
    }
  });
};
