import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../auth-services/auth-services';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-send-query-component',
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './send-query-component.html',
  styleUrl: './send-query-component.css',
})
export class SendQueryComponent implements OnInit {
  currentUserId: string = '';
  authSrv = inject(AuthService);
  router = inject(ActivatedRoute);
  property: any = [];
  destroy$ = new Subject<any>();
  realEstateApiSrv = inject(RealEstateApiService);
  propertyId: string = '';
  toastr = inject(ToastrService);
  messages: any = [];
  newMessage = '';
  cdr = inject(ChangeDetectorRef);
  converstationId: string = '';

  ngOnInit(): void {
    this.currentUserId = this.authSrv.getUser().id;
    this.converstationId = this.router.snapshot.paramMap.get('conversationId') || '';
    this.propertyId = this.router.snapshot.paramMap.get('propertyId') || '';
    if (this.converstationId != '' && this.propertyId != '') {
      this.loadConversations();
    } else {
      this.propertyId = this.router.snapshot.paramMap.get('id') || '';
      this.loadMessages();
    }
  }

  sendMessage(): void {
    if (!this.newMessage?.trim()) {
      return;
    }
    if (this.propertyId != '' && this.converstationId == '') {
      const payload = {
        propertyId: this.propertyId, // current property id
        message: this.newMessage.trim(),
      };
      this.realEstateApiSrv.sendQuery(payload).subscribe({
        next: (res: any) => {
          this.newMessage = '';
          this.loadMessages();
        },
        error: (err) => {
          console.error(err);
        },
      });
    } else {
      const payload = {
        conversationId: this.converstationId,
        message: this.newMessage,
      };
      this.realEstateApiSrv.replayQuery(payload).subscribe({
        next: (res: any) => {
          this.newMessage = '';
          this.loadMessages();
        },
        error: (err) => {
          console.error(err);
        },
      });
    }
  }

  loadMessages(): void {
    this.realEstateApiSrv.getMessages(this.propertyId).subscribe({
      next: (res: any) => {
        this.messages = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  loadConversations() {
    this.realEstateApiSrv.getConversations(this.converstationId).subscribe({
      next: (res: any) => {
        this.messages = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
