import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { LabTest, OrderPriority } from '../../models/order.model';

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss']
})
export class OrderCreateComponent implements OnInit {
  tests: LabTest[] = [];
  selectedIds = new Set<number>();
  priority: OrderPriority = 'ROUTINE';
  loading = false;
  loadingTests = true;

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderService.getAvailableTests().subscribe({
      next: t => { this.tests = t; this.loadingTests = false; },
      error: () => { this.loadingTests = false; }
    });
  }

  toggle(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  get selectedTests(): LabTest[] {
    return this.tests.filter(t => this.selectedIds.has(t.id));
  }

  get totalPrice(): number {
    return this.selectedTests.reduce((sum, t) => sum + t.price, 0);
  }

  get maxTurnaround(): number {
    return this.selectedTests.reduce((max, t) => Math.max(max, t.turnaroundHours), 0);
  }

  submit(): void {
    if (this.selectedIds.size === 0) return;
    this.loading = true;
    this.orderService.placeOrder({
      tests: Array.from(this.selectedIds),
      priority: this.priority,
      requestedBy: 0
    }).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: () => { this.loading = false; }
    });
  }
}
