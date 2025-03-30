import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => {
        if (key.includes('-auth-code-verifier')) {
          localStorage.removeItem(key);
        }
      }
    }
  },
  global: {
    headers: { 'x-custom-client': 'restaurant-app' }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

const connectionStatus = {
  isConnected: false,
  lastError: null as Error | null,
  retryCount: 0,
  maxRetries: 3,
  retryDelay: 1000,
  listeners: new Set<(status: boolean) => void>(),

  setStatus(connected: boolean, error: Error | null = null) {
    this.isConnected = connected;
    this.lastError = error;
    this.listeners.forEach(listener => listener(connected));
  },

  addListener(listener: (status: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  async checkConnection() {
    try {
      const { error } = await supabase
        .from('menu_items')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) throw error;
      
      this.setStatus(true);
      this.retryCount = 0;
      return true;
    } catch (err) {
      this.setStatus(false, err as Error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.checkConnection();
      }
      
      return false;
    }
  }
};

connectionStatus.checkConnection().catch(console.error);

export const getConnectionStatus = () => ({
  isConnected: connectionStatus.isConnected,
  lastError: connectionStatus.lastError,
  onStatusChange: connectionStatus.addListener.bind(connectionStatus),
  checkConnection: connectionStatus.checkConnection.bind(connectionStatus)
});