import { File, Paths } from 'expo-file-system';

class ApiConnector {
  private baseUrl: string | null = null;

  constructor() {
    this.loadBaseUrl();
  }

  private async loadBaseUrl() {
    try {
      const file = new File(Paths.cache, 'serverConfig.txt');
      if (file.exists) {
        this.baseUrl = file.textSync();
        console.log('Base URL loaded:', this.baseUrl);
      } else {
        console.warn('Server configuration file not found.');
      }
    } catch (error) {
      console.error('Error loading base URL:', error);
    }
  }

  public async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.baseUrl) {
      console.warn('Base URL is not set. Please configure the server.');
      throw new Error('Base URL is not set. Please configure the server.');
    }

    const url = `${this.baseUrl}/${endpoint}`;
    console.log('Making request to:', url);

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }
}

const apiConnector = new ApiConnector();
export default apiConnector;