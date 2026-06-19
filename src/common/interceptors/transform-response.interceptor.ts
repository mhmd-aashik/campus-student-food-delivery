import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { buildSuccessResponse } from '../helpers/api-response.helper';
import { Response } from 'express';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next
      .handle()
      .pipe(
        map((data) =>
          buildSuccessResponse(data, response.statusCode, request.url),
        ),
      );
  }
}
