import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Asegurar que conectamos solo si no está abierto
if (!redisClient.isOpen) {
  redisClient.connect();
}

export default redisClient;