import { IsNotEmpty, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Delivery address is required' })
  deliveryAddress!: string;

  @IsString()
  @IsNotEmpty({ message: 'Delivery phone is required' })
  deliveryPhone!: string;
}
