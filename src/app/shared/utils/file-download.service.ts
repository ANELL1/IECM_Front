import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const [url, timer] of this.pending) { clearTimeout(timer); URL.revokeObjectURL(url); }
      this.pending.clear();
    });
  }
  save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    try {
      link.href = url; link.download = filename; link.hidden = true;
      this.document.body.appendChild(link); link.click();
      // Dejar que el navegador consuma el archivo antes de liberar su URL.
      this.pending.set(url, setTimeout(() => { URL.revokeObjectURL(url); this.pending.delete(url); }, 30000));
    } catch (error) { URL.revokeObjectURL(url); throw error; }
    finally { link.remove(); }
  }
}
