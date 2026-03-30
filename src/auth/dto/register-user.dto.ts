import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    type: 'string',
    description: 'register the user email',
    required: true,
    example: 'user6@gmail.com',
  })
  @IsNotEmpty({ message: 'email can not be empty' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'Customer password',
    type: String,
  })
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters.' }) // Ensure password is between 8 and 50 characters
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number.' })
  @Matches(/[@$!%*?&#]/, {
    message: 'Password must contain at least one special character (@$!%*?&#).',
  })
  password: string;

  @ApiProperty({
    type: 'string',
    description: 'Enter Full Name',
    required: true,
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;
}
