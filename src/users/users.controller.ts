import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CookieGuard } from '../common/guards/cookie.guard';
import { UsersService } from './users.service';
import { UpdateDto } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(CookieGuard)
  @Get('me')
  async findMe(@Req() req) {
    return req.user;
  }
  @UseGuards(CookieGuard)
  @Patch('me')
  async update(@Req() req, @Body() @Body() body: UpdateDto) {
    return await this.usersService.update(req.user['id'], body);
  }

  @UseGuards(CookieGuard)
  @Delete('me')
  async remove(@Req() req) {
    return await this.usersService.remove(req.user['id']);
  }
}
