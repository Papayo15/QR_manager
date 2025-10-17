const API_BASE_URL = 'https://qr-manager-backend-l6dg.onrender.com';

export interface QRCode {
  code: string;
  houseNumber: number;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RegisterCodeRequest {
  houseNumber: number;
  condominio: string;
}

export interface HistoryResponse {
  codes: QRCode[];
}

class ApiService {
  private retryCount = 3;
  private retryDelay = 1000; // 1 segundo entre reintentos

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 15000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado tiempo');
      }
      throw error;
    }
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    timeout = 15000,
    retries = this.retryCount
  ): Promise<Response> {
    try {
      return await this.fetchWithTimeout(url, options, timeout);
    } catch (error: any) {
      if (retries > 0) {
        console.log(`Reintentando... quedan ${retries} intentos`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, timeout, retries - 1);
      }
      throw error;
    }
  }

  private handleError(error: any, operation: string): string {
    console.error(`Error en ${operation}:`, error);

    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return 'No se puede conectar al servidor. Verifica tu conexión a internet.';
    }

    if (error.message.includes('timeout') || error.message.includes('demasiado tiempo')) {
      return 'El servidor está tardando mucho en responder. Intenta de nuevo.';
    }

    if (error.message.includes('500')) {
      return 'Error del servidor. Por favor intenta más tarde.';
    }

    if (error.message.includes('404')) {
      return 'Servicio no encontrado. Contacta al administrador.';
    }

    return error.message || 'Error desconocido. Por favor intenta de nuevo.';
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithRetry(`${API_BASE_URL}/health`, {}, 10000, 2);
      const data = await response.json();
      console.log('Health check exitoso:', data);
      return { success: true, data };
    } catch (error: any) {
      const errorMsg = this.handleError(error, 'healthCheck');
      return { success: false, error: errorMsg };
    }
  }

  async registerCode(request: RegisterCodeRequest): Promise<ApiResponse<QRCode>> {
    try {
      console.log('Registrando código QR:', request);
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/api/register-code`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        20000 // 20 segundos de timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Código registrado exitosamente:', result);
      return { success: result.success, data: result.data };
    } catch (error: any) {
      const errorMsg = this.handleError(error, 'registerCode');
      return { success: false, error: errorMsg };
    }
  }

  async getHistory(houseNumber: number, condominio: string): Promise<ApiResponse<HistoryResponse>> {
    try {
      console.log('Obteniendo historial:', { houseNumber, condominio });
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/api/get-history?houseNumber=${houseNumber}&condominio=${condominio}`,
        {},
        20000
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Historial obtenido:', result);
      return { success: result.success, data: result.data };
    } catch (error: any) {
      const errorMsg = this.handleError(error, 'getHistory');
      return { success: false, error: errorMsg };
    }
  }
}

export default new ApiService();
