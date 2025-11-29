import { FileHandlerDependencies, FileAttachment } from '../types';
import { BYTES_PER_KB } from '../constants';

export class FileHandler {
  private dependencies: FileHandlerDependencies;

  constructor(dependencies: FileHandlerDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Opens file picker dialog for file attachment
   */
  public handleFileAttachment(): void {
    if (!this.dependencies.settings?.enableFileAttachments) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = this.dependencies.settings.maxFilesPerMessage > 1;
    input.accept = this.dependencies.settings.allowedFileTypes.join(',');

    input.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        this.processFiles(Array.from(files));
      }
    });

    input.click();
  }

  /**
   * Processes and validates selected files
   */
  public processFiles(files: File[]): void {
    if (!this.dependencies.settings?.enableFileAttachments) return;

    // Check rate limit
    if (!this.dependencies.rateLimiter.tryAcquire()) {
      const waitTime = Math.ceil(this.dependencies.rateLimiter.getWaitTime() / 1000);
      this.dependencies.showErrorMessage(
        `Please slow down. You can upload files again in ${waitTime} second${waitTime !== 1 ? 's' : ''}.`
      );
      return;
    }

    const maxFiles = this.dependencies.settings.maxFilesPerMessage;
    const maxSize = this.dependencies.settings.maxFileSizeMB * BYTES_PER_KB * BYTES_PER_KB;
    const allowedTypes = this.dependencies.settings.allowedFileTypes;

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      if (validFiles.length >= maxFiles) {
        this.dependencies.showErrorMessage(`Maximum ${maxFiles} files allowed per message`);
        break;
      }

      if (file.size > maxSize) {
        this.dependencies.showErrorMessage(`File "${file.name}" exceeds ${this.dependencies.settings.maxFileSizeMB}MB limit`);
        continue;
      }

      // Check file type
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type || file.name.endsWith(type.replace('*', ''));
      });

      if (!isAllowed) {
        this.dependencies.showErrorMessage(`File type "${file.type}" is not allowed`);
        continue;
      }

      validFiles.push(file);
    }

    this.dependencies.pendingFiles.push(...validFiles);
    this.updateFilePreview();
    this.dependencies.trackAnalyticsEvent('files_attached', { count: validFiles.length });
  }

  /**
   * Updates the file preview UI with pending files
   */
  public updateFilePreview(): void {
    let previewContainer = document.getElementById('intelliconvo-file-preview');

    if (this.dependencies.pendingFiles.length === 0) {
      if (previewContainer) previewContainer.remove();
      return;
    }

    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'intelliconvo-file-preview';
      previewContainer.className = 'intelliconvo-file-preview';

      const inputArea = document.querySelector('.intelliconvo-input');
      if (inputArea) {
        inputArea.insertBefore(previewContainer, inputArea.firstChild);
      }
    }

    previewContainer.innerHTML = this.dependencies.pendingFiles.map((file, index) => `
      <div class="intelliconvo-file-item" data-file-index="${index}">
        <span class="intelliconvo-file-name">${this.dependencies.sanitizeHtml(file.name)}</span>
        <div class="intelliconvo-file-progress" id="file-progress-${index}" style="display: none;">
          <div class="intelliconvo-file-progress-bar">
            <div class="intelliconvo-file-progress-fill" style="width: 0%"></div>
          </div>
          <span class="intelliconvo-file-progress-text">0%</span>
        </div>
        <button
          class="intelliconvo-file-remove"
          data-index="${index}"
          aria-label="Remove ${file.name}"
        >×</button>
      </div>
    `).join('');

    // Add remove handlers
    previewContainer.querySelectorAll('.intelliconvo-file-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        this.removeFile(index);
      });
    });
  }

  /**
   * Removes a file from the pending files list
   */
  public removeFile(index: number): void {
    this.dependencies.pendingFiles.splice(index, 1);
    this.updateFilePreview();
  }

  /**
   * Clears all pending files
   */
  public clearPendingFiles(): void {
    this.dependencies.pendingFiles.length = 0;
    this.updateFilePreview();
  }

  /**
   * Prepares file attachments for sending (converts to base64)
   */
  public async prepareFileAttachments(): Promise<FileAttachment[]> {
    const attachments: FileAttachment[] = [];
    const totalFiles = this.dependencies.pendingFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = this.dependencies.pendingFiles[i];

      try {
        // Update status to processing
        this.updateFileProgress(i, file.name, 0, 'processing');

        // Simulate progress during base64 conversion
        const data = await this.fileToBase64WithProgress(file, (progress) => {
          this.updateFileProgress(i, file.name, progress, 'processing');
        });

        attachments.push({
          name: file.name,
          type: file.type,
          data,
        });

        // Mark as completed
        this.updateFileProgress(i, file.name, 100, 'completed');
      } catch (error) {
        console.error('Failed to process file:', file.name, error);
        this.updateFileProgress(i, file.name, 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return attachments;
  }

  /**
   * Converts a File object to base64 string with progress tracking
   */
  private fileToBase64WithProgress(file: File, onProgress: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        onProgress(100);
        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Updates the file upload progress UI
   */
  private updateFileProgress(
    fileIndex: number,
    fileName: string,
    progress: number,
    status: 'pending' | 'processing' | 'completed' | 'error',
    error?: string
  ): void {
    const progressContainer = document.getElementById(`file-progress-${fileIndex}`);
    const fileItem = document.querySelector(`[data-file-index="${fileIndex}"]`);

    if (!progressContainer || !fileItem) return;

    // Show/hide progress container
    if (status === 'processing') {
      progressContainer.style.display = 'flex';
    } else if (status === 'completed' || status === 'error') {
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 1000);
    }

    // Update progress bar
    const progressFill = progressContainer.querySelector('.intelliconvo-file-progress-fill') as HTMLElement;
    const progressText = progressContainer.querySelector('.intelliconvo-file-progress-text') as HTMLElement;

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (progressText) {
      if (status === 'error') {
        progressText.textContent = 'Error';
        progressText.style.color = '#ef4444';
      } else {
        progressText.textContent = `${progress}%`;
      }
    }

    // Update file item class based on status
    fileItem.classList.remove('file-processing', 'file-completed', 'file-error');
    if (status === 'processing') {
      fileItem.classList.add('file-processing');
    } else if (status === 'completed') {
      fileItem.classList.add('file-completed');
    } else if (status === 'error') {
      fileItem.classList.add('file-error');
    }

    // Call optional callback
    if (this.dependencies.onUploadProgress) {
      this.dependencies.onUploadProgress({
        fileIndex,
        fileName,
        progress,
        status,
        error,
      });
    }
  }

  /**
   * Gets the current pending files
   */
  public getPendingFiles(): File[] {
    return this.dependencies.pendingFiles;
  }

  /**
   * Checks if there are pending files
   */
  public hasPendingFiles(): boolean {
    return this.dependencies.pendingFiles.length > 0;
  }
}
