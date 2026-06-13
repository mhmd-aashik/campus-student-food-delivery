import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  restaurantLogo: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(() => {
      return { userId: 'system' };
    })
    .onUploadComplete(({ file }) => {
      console.log('Restaurant logo upload complete', file.ufsUrl);
      return { url: file.ufsUrl };
    }),
  menuImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => {
      return { userId: 'system' };
    })
    .onUploadComplete(({ file }) => {
      console.log('Menu image upload complete', file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
