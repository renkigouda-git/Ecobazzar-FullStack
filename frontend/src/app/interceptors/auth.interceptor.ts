import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const toastr = inject(ToastrService);

  const token = localStorage.getItem('token');

  const isCloudinary = req.url.includes('api.cloudinary.com');

  if (token && !isCloudinary) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {

      // ⭐ DO NOT logout on product public API
      const isProductPublic = req.url.includes('/api/products') && req.method === 'GET';

      if (err.status === 401 && !isCloudinary && !isProductPublic) {
        toastr.error('Session expired. Please login again.');
        localStorage.clear();
        router.navigate(['/login']);
      }

      if (err.status === 403) {
        toastr.error('Access denied.');
      }

      return throwError(() => err);
    })
  );
};
