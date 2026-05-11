import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';
import { InventoryItem } from '../../models/inventory.model';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<InventoryItem>();
  displayedColumns = ['itemName', 'quantity', 'lowStock', 'description', 'actions'];
  loading = true;
  role: string | null = null;
  adjustForm!: FormGroup;
  addForm!: FormGroup;
  selectedItem: InventoryItem | null = null;
  showAdjustPanel = false;
  showAddPanel = false;

  readonly unitOptions = ['pcs', 'vials', 'ml', 'L', 'mg', 'g', 'kg', 'boxes', 'strips', 'kits', 'tubes', 'bottles', 'packs'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private invService: InventoryService,
    public auth: AuthService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.role = this.auth.role;
    this.adjustForm = this.fb.group({
      quantityChange: [null, [Validators.required]],
      reason: ['', Validators.required]
    });
    this.addForm = this.fb.group({
      itemName:          ['', Validators.required],
      quantity:          [0, [Validators.required, Validators.min(0)]],
      unit:              ['', Validators.required],
      description:       [''],
      lowStockThreshold: [10, [Validators.min(0)]]
    });
    this.load();

    if (this.route.snapshot.queryParamMap.get('add') === 'true' && this.role === 'ADMIN') {
      this.openAddItem();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  load(): void {
    this.loading = true;
    this.invService.getInventory().subscribe({
      next: items => {
        this.dataSource.data = items;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  clearFilter(): void { this.dataSource.filter = ''; }

  openAdjust(item: InventoryItem): void {
    this.selectedItem = item;
    this.adjustForm.reset();
    this.showAdjustPanel = true;
  }

  submitAdjust(): void {
    if (this.adjustForm.invalid || !this.selectedItem) return;
    this.invService.adjustInventory({ itemId: this.selectedItem.id, ...this.adjustForm.value }).subscribe({
      next: () => {
        this.snack.open('Stock adjusted', 'Close', { duration: 3000 });
        this.showAdjustPanel = false;
        this.load();
      }
    });
  }

  openAddItem(): void {
    this.addForm.reset({ quantity: 0, lowStockThreshold: 10 });
    this.showAddPanel = true;
    this.showAdjustPanel = false;
  }

  submitAdd(): void {
    if (this.addForm.invalid) return;
    this.invService.addInventoryItem(this.addForm.value).subscribe({
      next: () => {
        this.snack.open('Item added to inventory', 'Close', { duration: 3000 });
        this.showAddPanel = false;
        this.load();
      }
    });
  }
}
