import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserContext } from '@markethub/shared';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current cart items grouped by vendor' })
  async getCart(
    @CurrentUser() user?: UserContext,
    @Headers('x-session-token') sessionToken?: string,
  ) {
    return this.cartService.getCart(user?.id, sessionToken);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Add product to cart' })
  async addItem(
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
    @CurrentUser() user?: UserContext,
    @Headers('x-session-token') sessionToken?: string,
  ) {
    return this.cartService.addItem(productId, quantity || 1, user?.id, sessionToken);
  }

  @Public()
  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateQuantity(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @CurrentUser() user?: UserContext,
    @Headers('x-session-token') sessionToken?: string,
  ) {
    return this.cartService.updateQuantity(id, quantity, user?.id, sessionToken);
  }

  @Public()
  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Param('id') id: string,
    @CurrentUser() user?: UserContext,
    @Headers('x-session-token') sessionToken?: string,
  ) {
    return this.cartService.removeItem(id, user?.id, sessionToken);
  }
}
