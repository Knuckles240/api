import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateDto } from './users.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(AccessTokenGuard)
  @Get('me')
  async findOne(@Req() req) {
    return await this.usersService.findOne(req.user['id']);
  }
  @UseGuards(AccessTokenGuard)
  @Patch('me')
  async update(@Req() req, @Body() @Body() body: UpdateDto) {
    return await this.usersService.update(req.user['id'], body);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('me')
  async remove(@Req() req) {
    return await this.usersService.remove(req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/likes')
  async findMyLikes(@Req() req) {
    return await this.usersService.findMyLikes(req.user['id']);
  }
}
