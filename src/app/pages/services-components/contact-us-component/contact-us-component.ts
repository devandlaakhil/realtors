import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-contact-us-component',
  imports: [CommonModule],
  templateUrl: './contact-us-component.html',
  styleUrl: './contact-us-component.css',
})
export class ContactUsComponent {
  scrollToSkills(element: HTMLElement) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
