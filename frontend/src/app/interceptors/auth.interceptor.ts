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

  // Attach token
  if (token && !isCloudinary) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {

      // ❌ DO NOT AUTO LOGOUT
      if (err.status === 401) {
        console.warn("401 Unauthorized detected → ignoring auto logout");
      }

      if (err.status === 403) {
        toastr.error('Access denied.');
      }

      return throwError(() => err);
    })
  );
};
