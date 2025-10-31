import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les services' })
  async findAll(@Query('sousSecteur') sousSecteurId?: string) {
    return this.servicesService.findAll(sousSecteurId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupère un service par ID' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}

