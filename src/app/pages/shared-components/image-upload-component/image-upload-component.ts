import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-image-upload-component',
  imports: [CommonModule, MatButton],
  templateUrl: './image-upload-component.html',
  styleUrl: './image-upload-component.css',
})
export class ImageUploadComponent {
  @Input() imageUrl: string | null = null;
  @Input() multiple = false;
  @Output() fileSelected = new EventEmitter<File | null>();
  preview: string | ArrayBuffer | null = null;

  cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
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

  removeImage(fileInput: HTMLInputElement): void {
    this.preview = null;
    fileInput.value = '';
    this.fileSelected.emit(null);
  }
}
