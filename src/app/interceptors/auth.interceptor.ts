import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const alertService = inject(AlertService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('/api/login')) {
                // Clear local state and redirect to login on 401
                localStorage.removeItem('currentUser');
                authService.setUser(null);

                // Only redirect if not already on login/register/verify pages
                const currentUrl = router.url;
                if (!currentUrl.includes('/login') && !currentUrl.includes('/register') && !currentUrl.includes('/verify')) {
                    alertService.error('Your session has expired. Please login again.');
                    router.navigate(['/login']);
                }
            }
            return throwError(() => error);
        })
    );
};
