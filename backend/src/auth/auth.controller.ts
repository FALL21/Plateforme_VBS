import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un code OTP' })
  @ApiResponse({ status: 200, description: 'Code OTP envoyé' })
  async requestOtp(@Body() dto: OtpRequestDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le code OTP et obtenir les tokens' })
  @ApiResponse({ status: 200, description: 'Authentification réussie, tokens retournés' })
  @ApiResponse({ status: 401, description: 'Code OTP invalide' })
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion (côté client, invalider le token)' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout() {
    return { message: 'Déconnexion réussie' };
  }
}

