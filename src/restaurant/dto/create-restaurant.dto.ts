import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty({ message: 'Restaurant name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address!: string;

  @IsString()
  @IsOptional()
  @Matches(/^https:\/\/(?:[a-zA-Z0-9-]+\.)*(?:utfs\.io|ufs\.sh)\/f\/.+$/, {
    message: 'Logo URL must be a valid UploadThing file URL',
  })
  logoUrl?: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;
}
