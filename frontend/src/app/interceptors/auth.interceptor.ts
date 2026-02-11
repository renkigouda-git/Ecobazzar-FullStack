import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const toastr = inject(ToastrService);

  const token = localStorage.getItem('token');

  // ONLY skip Cloudinary
  const isCloudinary = req.url.includes('api.cloudinary.com');

  if (token && !isCloudinary) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {

      if (err.status === 401 && !isCloudinary) {
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
