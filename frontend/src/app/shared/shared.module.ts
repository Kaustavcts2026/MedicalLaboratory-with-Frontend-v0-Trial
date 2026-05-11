import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRippleModule } from '@angular/material/core';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ProfileFabComponent } from './components/profile-fab/profile-fab.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { StatusLabelPipe } from './pipes/status-label.pipe';

const MAT_MODULES = [
  MatToolbarModule, MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule,
  MatCardModule, MatTableModule, MatPaginatorModule, MatSortModule,
  MatFormFieldModule, MatInputModule, MatSelectModule,
  MatDatepickerModule, MatNativeDateModule,
  MatSnackBarModule, MatDialogModule,
  MatProgressSpinnerModule, MatProgressBarModule,
  MatTooltipModule, MatListModule, MatDividerModule,
  MatTabsModule, MatStepperModule, MatCheckboxModule, MatRadioModule,
  MatSlideToggleModule, MatChipsModule, MatExpansionModule,
  MatGridListModule, MatSidenavModule, MatAutocompleteModule, MatRippleModule
];

@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
    ProfileFabComponent,
    PageNotFoundComponent,
    ConfirmDialogComponent,
    SkeletonLoaderComponent,
    BreadcrumbComponent,
    StatusLabelPipe
  ],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ...MAT_MODULES],
  exports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule,
    NavbarComponent, SidebarComponent, ProfileFabComponent, PageNotFoundComponent,
    ConfirmDialogComponent, SkeletonLoaderComponent, BreadcrumbComponent, StatusLabelPipe,
    ...MAT_MODULES
  ]
})
export class SharedModule {}
