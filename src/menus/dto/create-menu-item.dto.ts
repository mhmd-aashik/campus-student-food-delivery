import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID('4', { message: 'Invalid restaurant ID' })
  @IsNotEmpty({ message: 'Restaurant ID is required' })
  restaurantId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Menu item name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt({ message: 'Price must be an integer' })
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
