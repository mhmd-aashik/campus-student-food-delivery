import { IsNotEmpty, IsInt, Min, IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsUUID('4', { message: 'Invalid menu item ID' })
  @IsNotEmpty({ message: 'Menu item ID is required' })
  menuId!: string;

  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;
}
