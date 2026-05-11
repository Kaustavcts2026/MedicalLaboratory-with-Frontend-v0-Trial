import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { NotificationRoutingModule } from './notification-routing.module';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';

@NgModule({
  declarations: [NotificationPanelComponent],
  imports: [
    CommonModule,
    NotificationRoutingModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class NotificationModule {}
