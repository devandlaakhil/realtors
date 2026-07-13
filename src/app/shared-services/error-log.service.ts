import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injectable } from '@angular/core';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from './supabase-client.service';

export interface ErrorLogPayload {
  source: string;
  action?: string;
  message?: string;
  details?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ErrorLogService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private queue: any[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private readonly maxBatchSize = 5;

  log(payload: ErrorLogPayload): void {
    if (!this.supabase.enabled) return;

    const error = this.normalize(payload.details);
    this.queue.push({
      user_id: this.auth.getUser()?.id || null,
      source: payload.source,
      action: payload.action || '',
      message: payload.message || error.message || 'Unknown error',
      error_name: error.name,
      error_code: error.code,
      status_code: error.status,
      url: error.url || location.href,
      route: location.hash || location.pathname,
      user_agent: navigator.userAgent,
      stack: error.stack,
      metadata: error.metadata,
    });

    if (this.queue.length > 25) this.queue = this.queue.slice(-25);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (!this.auth.getToken()) return;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flush(), 500);
  }

  private flush(): void {
    this.flushTimer = null;
    if (this.flushing || !this.queue.length) return;

    this.flushing = true;
    const batch = this.queue.splice(0, this.maxBatchSize);
    this.supabase.insert<any>(SUPABASE_TABLES.errorLogs, batch).subscribe({
      next: () => {
        this.flushing = false;
        if (this.queue.length) this.scheduleFlush();
      },
      error: () => {
        this.flushing = false;
      },
    });
  }

  private normalize(details: unknown): any {
    if (details instanceof HttpErrorResponse) {
      return {
        name: 'HttpErrorResponse',
        message: details.error?.message || details.message,
        code: details.error?.code || details.statusText,
        status: details.status,
        url: details.url,
        metadata: details.error || {},
      };
    }

    if (details instanceof Error) {
      return {
        name: details.name,
        message: details.message,
        stack: details.stack,
        metadata: {},
      };
    }

    if (details && typeof details === 'object') {
      const value = details as any;
      return {
        name: value.name || '',
        message: value.message || JSON.stringify(value),
        code: value.code || value.error_code || '',
        status: value.status || value.statusCode || '',
        stack: value.stack || '',
        metadata: value,
      };
    }

    return {
      name: '',
      message: String(details || ''),
      metadata: {},
    };
  }
}

@Injectable()
export class AppGlobalErrorHandler implements ErrorHandler {
  private readonly logs = inject(ErrorLogService);

  handleError(error: unknown): void {
    this.logs.log({ source: 'global', action: 'unhandled_error', details: error });
    console.error(error);
  }
}
