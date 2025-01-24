import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string = '';
  loading: boolean = false;
  returnUrl: string = '/orders';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Pegar a URL de retorno dos query params ou usar o padrão
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/orders';

    // Verificar se já está autenticado e redirecionar se estiver
    this.authService.isAuthenticated()
      .pipe(take(1))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate([this.returnUrl]);
        }
      });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.error = error.error.message || 'Erro ao fazer login';
        this.loading = false;
      }
    });
  }
} 