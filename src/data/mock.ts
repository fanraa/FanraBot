import { AIProvider, BotCommand, Conversation, SystemLog } from '../types';

export const MOCK_CHATS: Conversation[] = [
  { id: '1', contactName: 'Budi Santoso', lastMessage: 'Halo, bot bisa bantu carikan tiket?', timestamp: '10:30', status: 'active' },
  { id: '2', contactName: 'Siti Aminah', lastMessage: 'Terima kasih informasinya.', timestamp: '09:15', status: 'active' },
  { id: '3', contactName: 'Grup Jualan Kaos', lastMessage: 'Update stok terbaru dong.', timestamp: 'Kemarin', status: 'active' },
  { id: '4', contactName: 'Agus Pratama', lastMessage: 'Berapa harganya?', timestamp: 'Kemarin', status: 'archived' },
];

export const MOCK_PROVIDERS: AIProvider[] = [
  { id: 'gemini', name: 'Gemini', status: 'active', apiKey: '••••••••••••••••', lastValidated: '3 Menit yang lalu' },
  { id: 'groq', name: 'Groq', status: 'error', apiKey: '••••••••••••••••', lastValidated: '1 Jam yang lalu' },
  { id: 'openai', name: 'OpenAI', status: 'disconnected', apiKey: '', lastValidated: '-' },
  { id: 'anthropic', name: 'Anthropic', status: 'disconnected', apiKey: '', lastValidated: '-' },
];

export const MOCK_COMMANDS: BotCommand[] = [
  { id: '1', name: '/start', category: 'General', status: 'active' },
  { id: '2', name: '/help', category: 'General', status: 'active' },
  { id: '3', name: '/harga', category: 'Business', status: 'active' },
  { id: '4', name: '/stok', category: 'Business', status: 'inactive' },
];

export const MOCK_LOGS: SystemLog[] = [
  { id: '1', timestamp: '2026-06-03 17:15:20', event: 'Chat Response', provider: 'Gemini', status: 'success', detail: 'Pesan berhasil dibalas ke 62812...' },
  { id: '2', timestamp: '2026-06-03 17:14:05', event: 'API Authentication', provider: 'Groq', status: 'error', detail: 'Invalid API Key' },
  { id: '3', timestamp: '2026-06-03 17:12:44', event: 'System Boot', provider: 'System', status: 'success', detail: 'Bot engine started successfully' },
  { id: '4', timestamp: '2026-06-03 17:10:11', event: 'Websocket Connection', provider: 'WhatsApp', status: 'warning', detail: 'Retrying connection...' },
];
