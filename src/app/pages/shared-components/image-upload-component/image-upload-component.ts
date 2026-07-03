import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { PermissionsServices } from '../../../shared-services/permissions.services';

@Component({
  selector: 'app-image-upload-component',
  imports: [CommonModule, MatButton],
  templateUrl: './image-upload-component.html',
})
export class ImageUploadComponent {
  @Input() imageUrl: string | null = null;
  @Input() multiple = false;
  @Output() fileSelected = new EventEmitter<File | null>();
  preview: string | ArrayBuffer | null = null;

  cdr = inject(ChangeDetectorRef);
  private permissionSrv = inject(PermissionsServices);

  ngOnInit(): void {
    this.permissionSrv.requestCameraPermission();
    if (this.imageUrl) {
      this.preview = this.imageUrl;
      this.cdr.detectChanges();
    }
  }

  ngOnChanges() {
    this.preview = this.imageUrl;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.fileSelected.emit(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.preview = reader.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage(fileInput: HTMLInputElement, cameraInput: HTMLInputElement): void {
    this.preview = null;
    fileInput.value = '';
    cameraInput.value = '';
    this.fileSelected.emit(null);
  }
}
