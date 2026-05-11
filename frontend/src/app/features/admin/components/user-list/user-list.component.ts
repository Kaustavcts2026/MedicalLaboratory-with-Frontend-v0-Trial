import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { AppUser } from '../../models/admin.model';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { InventoryItem } from '../../../inventory/models/inventory.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<AppUser>();
  loading = true;
  displayedColumns = ['id', 'username', 'role'];

  // G12: Broadcast notification
  broadcastMessage = new FormControl('', [Validators.required, Validators.minLength(5)]);
  broadcasting = false;

  // Inventory overview (read-only)
  inventoryItems: InventoryItem[] = [];
  invLoading = false;
  invColumns = ['itemName', 'quantity', 'status'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private snack: MatSnackBar,
    private invService: InventoryService
  ) {}

  ngOnInit(): void {
    this.adminService.getUsers().subscribe({
      next: users => {
        this.dataSource.data = users;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.invLoading = true;
    this.invService.getInventory().subscribe({
      next: items => { this.inventoryItems = items; this.invLoading = false; },
      error: () => { this.invLoading = false; }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: AppUser, filter: string) => {
      const term = filter.trim().toLowerCase();
      return data.username.toLowerCase().includes(term) ||
             data.role.toLowerCase().includes(term);
    };
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  clearFilter(): void { this.dataSource.filter = ''; }

  goCreateLabTech(): void {
    this.router.navigate(['/admin/create-lab-tech']);
  }

  roleColor(role: string): string {
    switch (role) {
      case 'ADMIN':    return 'warn';
      case 'LAB_TECH': return 'accent';
      default:         return 'primary';
    }
  }

  sendBroadcast(): void {
    if (this.broadcastMessage.invalid) return;
    this.broadcasting = true;
    this.adminService.broadcast(this.broadcastMessage.value!).subscribe({
      next: () => {
        this.snack.open('Broadcast sent to all patients.', 'Close', { duration: 4000 });
        this.broadcastMessage.reset();
        this.broadcasting = false;
      },
      error: () => { this.broadcasting = false; }
    });
  }
}
