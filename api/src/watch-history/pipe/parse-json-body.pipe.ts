import { Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { SaveProgressDto } from '../dto/save-progress.dto';

@Injectable()
export class ParseJsonBodyPipe implements PipeTransform {
  transform(value: unknown) {
    const parsed: unknown =
      typeof value === 'string' ? (JSON.parse(value) as unknown) : value;
    return plainToInstance(SaveProgressDto, parsed);
  }
}
