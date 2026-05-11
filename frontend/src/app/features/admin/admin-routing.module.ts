import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { CreateLabTechComponent } from './components/create-lab-tech/create-lab-tech.component';

const routes: Routes = [
  { path: '', component: UserListComponent },
  { path: 'create-lab-tech', component: CreateLabTechComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
