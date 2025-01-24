import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { OrderModel } from './models/order.model';
import { AuthController } from './controllers/auth.controller';
import { authMiddleware, AuthRequest } from './middlewares/auth.middleware';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuração do CORS
const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];

// Adiciona a URL do frontend em produção se existir
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Configuração do Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

const port = process.env.PORT || 3000;

// Aplicar CORS no Express
app.use(cors(corsOptions));
app.use(express.json());

// WebSocket Events
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Envia os pedidos atuais quando um cliente se conecta
  OrderModel.findToday()
    .then(orders => {
      socket.emit('initialOrders', orders);
    })
    .catch(error => {
      console.error('Erro ao buscar pedidos iniciais:', error);
    });

  socket.on('orderUpdated', (order) => {
    console.log('Pedido atualizado recebido:', order);
    io.emit('orderUpdated', order);
  });

  socket.on('orderCreated', (order) => {
    console.log('Novo pedido recebido:', order);
    io.emit('orderCreated', order);
  });

  socket.on('orderDeleted', (orderId) => {
    console.log('Pedido deletado:', orderId);
    io.emit('orderDeleted', orderId);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

// Auth routes
const authController = new AuthController();
app.post('/api/login', (req, res) => authController.login(req, res));

// Protected routes
app.post('/api/orders', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const order = await OrderModel.create(req.body);
    
    if (!order) {
      throw new Error('Falha ao criar pedido');
    }

    io.emit('orderCreated', order);
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ 
      error: 'Erro ao criar pedido',
      details: error?.message || 'Erro desconhecido'
    });
  }
});

app.get('/api/orders', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const orders = await OrderModel.findAll();
    res.json(orders);
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar pedidos',
      details: error?.message 
    });
  }
});

app.get('/api/orders/today', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const orders = await OrderModel.findToday();
    res.json(orders);
  } catch (error: any) {
    console.error('Erro ao buscar pedidos de hoje:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar pedidos de hoje',
      details: error?.message 
    });
  }
});

app.patch('/api/orders/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        error: 'ID do pedido é obrigatório'
      });
    }

    const order = await OrderModel.updateStatus(req.params.id, req.body.status);
    
    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado'
      });
    }

    io.emit('orderUpdated', order);
    res.json(order);
  } catch (error: any) {
    console.error('Erro ao atualizar status:', error);
    if (error.message === 'Pedido não encontrado') {
      res.status(404).json({
        error: 'Pedido não encontrado',
        details: error.message
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao atualizar status',
        details: error?.message 
      });
    }
  }
});

app.delete('/api/orders/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        error: 'ID do pedido é obrigatório'
      });
    }

    await OrderModel.delete(req.params.id);
    
    io.emit('orderDeleted', req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar pedido:', error);
    if (error.message === 'Pedido não encontrado') {
      res.status(404).json({
        error: 'Pedido não encontrado',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Erro ao deletar pedido',
        details: error.message
      });
    }
  }
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}); 