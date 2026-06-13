import { Controller, Next, Req, Res } from '@nestjs/common';
import { createRouteHandler } from 'uploadthing/express';
import { uploadRouter } from './uploadthing';
import * as express from 'express';

const handler = createRouteHandler({
  router: uploadRouter,
});

@Controller('uploadthing')
export class UploadthingController {
  handleUpload(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Next() next: express.NextFunction,
  ) {
    return handler(req, res, next);
  }
}
