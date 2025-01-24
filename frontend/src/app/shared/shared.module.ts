import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material.module';
import { HeaderComponent } from './components/header/header.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    HeaderComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    MatToolbarModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  exports: [
    HeaderComponent,
    ConfirmDialogComponent,
    MaterialModule,
    MatToolbarModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ]
})
export class SharedModule { } 