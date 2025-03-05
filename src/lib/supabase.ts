import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click the "Connect to Supabase" button in the top right to set up Supabase.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL format. Please check your environment variables.');
}

// Create a singleton instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Enable all providers
    flowType: 'pkce',
    detectSessionInUrl: true,
    providers: ['google', 'facebook', 'phone']
  },
  global: {
    headers: {
      'x-custom-client': 'restaurant-app'
    }
  },
  // Add retry configuration
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Create a connection status handler
const connectionStatus = {
  isConnected: false,
  lastError: null as Error | null,
  retryCount: 0,
  maxRetries: 3,
  retryDelay: 1000, // 1 second
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
      // Simple query to check connection
      const { data, error } = await supabase
        .from('menu_items')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) throw error;
      
      this.setStatus(true);
      this.retryCount = 0;
      return true;
    } catch (err) {
      this.setStatus(false, err as Error);
      
      // Implement retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.checkConnection();
      }
      
      return false;
    }
  }
};

// Initialize connection
connectionStatus.checkConnection().catch(console.error);

// Export utilities
export const getConnectionStatus = () => ({
  isConnected: connectionStatus.isConnected,
  lastError: connectionStatus.lastError,
  onStatusChange: connectionStatus.addListener.bind(connectionStatus),
  checkConnection: connectionStatus.checkConnection.bind(connectionStatus)
});