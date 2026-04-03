import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { QuickBuyDto } from './dto/quick-buy.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('quick-buy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quick buy a product variant' })
  @ApiResponse({ status: 201, description: 'Order placed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid request or insufficient stock',
  })
  async quickBuy(@Request() req, @Body() dto: QuickBuyDto) {
    console.log('req.user:', req.user);
    return this.orderService.quickBuy(req.user.userId, dto); //userId from JWT
  }
}
