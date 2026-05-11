import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LabTest } from '../../models/inventory.model';

@Component({
  selector: 'app-lab-test-catalog',
  templateUrl: './lab-test-catalog.component.html',
  styleUrls: ['./lab-test-catalog.component.scss']
})
export class LabTestCatalogComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<LabTest>();
  displayedColumns = ['code', 'name', 'price', 'turnaroundHours', 'description', 'actions'];
  loading = true;
  role: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private invService: InventoryService, public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    this.invService.getTests().subscribe({
      next: tests => {
        this.dataSource.data = tests;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  edit(id: number): void { this.router.navigate(['/inventory/tests', id, 'edit']); }
  addNew(): void { this.router.navigate(['/inventory/tests/new']); }
}
