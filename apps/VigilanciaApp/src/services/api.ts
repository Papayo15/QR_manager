const API_BASE_URL = 'https://qr-manager-3z8x.onrender.com';

export interface ValidateQRRequest {
  code: string;
}

export interface ValidateQRResponse {
  valid: boolean;
  message: string;
  houseNumber?: number;
  expiresAt?: string;
}

export interface CountersResponse {
  generated: number;
  validated: number;
  denied: number;
  date: string;
}

export interface RegisterWorkerRequest {
  houseNumber: number;
  workerType: string;
  photoBase64: string;
  condominio: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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

  async validateQR(request: ValidateQRRequest): Promise<ApiResponse<ValidateQRResponse>> {
    try {
      console.log('Validando código QR:', request);
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/api/validate-qr`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        20000
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Código validado:', result);
      return { success: result.success, data: result.data };
    } catch (error: any) {
      const errorMsg = this.handleError(error, 'validateQR');
      return { success: false, error: errorMsg };
    }
  }

  async getCounters(): Promise<ApiResponse<CountersResponse>> {
    try {
      console.log('Obteniendo contadores');
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/api/counters`,
        {},
        20000
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Contadores obtenidos:', result);
      return { success: result.success, data: result.data };
    } catch (error: any) {
      const errorMsg = this.handleError(error, 'getCounters');
      return { success: false, error: errorMsg };
    }
  }

  async registerWorker(request: RegisterWorkerRequest): Promise<ApiResponse<any>> {
    try {
      console.log('Registrando trabajador');
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/api/register-worker`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        30000, // Mayor timeout para subir fotos
        2 // Menos reintentos para subida de fotos
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Trabajador registrado:', result);
      return { success: result.success, data: result.data };
    } catch (error: any) {
      const errorMsg = this.handleError(error, 'registerWorker');
      return { success: false, error: errorMsg };
    }
  }
}

export default new ApiService();
