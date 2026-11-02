import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Navigation Router State Tracker
  activeTab: 'submit' | 'admin' = 'submit'; 

  // Form Property Fields
  employeeName = '';
  leaveReason = '';
  selectedFile: File | null = null;
  
  // Dynamic UI Alert Indicators
  nodeLog = '';
  recordsList: any[] = []; 

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchHistoryList();
  }

  // Navigation controller routine to alter isolated page view states dynamically
  switchTab(tabName: 'submit' | 'admin') {
    this.activeTab = tabName;
    if (tabName === 'admin') {
      this.fetchHistoryList(); // Auto-refresh data fields on page loading routing event
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  fetchHistoryList() {
    this.http.get('http://localhost:3000/api/leave/records').subscribe({
      next: (data: any) => {
        this.recordsList = data;
      },
      error: () => console.log('Unable to query active log dashboard data streams.')
    });
  }

  submitToPipelines() {
    if (!this.employeeName || !this.leaveReason) {
      alert('Please fill out your name and leave reason fields.');
      return;
    }

    this.nodeLog = 'Processing tracking payload to Node.js backend...';

    const payload = new FormData();
    payload.append('employeeName', this.employeeName);
    payload.append('reason', this.leaveReason);
    
    if (this.selectedFile) {
      payload.append('certificate', this.selectedFile, this.selectedFile.name);
    }

    this.http.post('http://localhost:3000/api/leave/submit', payload).subscribe({
      next: (res: any) => {
        this.nodeLog = `✔️ Success: Application compiled successfully!`;
        this.fetchHistoryList(); 
        
        // Reset data fields cleanly
        this.employeeName = '';
        this.leaveReason = '';
        this.selectedFile = null;
        
        const fileInput = document.querySelector('.file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: () => {
        this.nodeLog = '❌ Node.js server offline. Ensure server.js is running on Port 3000.';
      }
    });
  }

  deleteRecord(id: string) {
    if (confirm('Are you absolutely sure you want to permanently delete this log record?')) {
      this.http.delete(`http://localhost:3000/api/leave/delete/${id}`).subscribe({
        next: () => {
          this.nodeLog = '🗑️ Record and file physically purged successfully.';
          this.fetchHistoryList();
        },
        error: () => {
          this.nodeLog = '❌ Unable to complete deletion request processing operations.';
        }
      });
    }
  }
}
