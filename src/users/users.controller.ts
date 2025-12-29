import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateDto } from './users.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Get('me')
  @ApiOperation({ summary: 'Retorna o meu usuário' })
  async findOne(@Req() req) {
    return await this.usersService.findOne(req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Edita informações do meu usuário.' })
  async update(@Req() req, @Body() body: UpdateDto) {
    return await this.usersService.update(req.user['id'], body);
  }
  
  @UseGuards(AccessTokenGuard)
  @Delete('me')
  @ApiOperation({ summary: 'Deleta o meu usuário.' })
  async remove(@Req() req) {
    return await this.usersService.remove(req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Get('me/likes')
  @ApiOperation({ summary: 'Retorna os posts com like do meu usuário.' })
  async findMyLikes(@Req() req) {
    return await this.usersService.findMyLikes(req.user['id']);
  }
}
