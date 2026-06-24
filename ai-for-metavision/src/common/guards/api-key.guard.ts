import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const expected = process.env.AI_API_KEY;
    if (!expected) return true;

    const auth = request.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const headerKey = request.headers['x-api-key'];

    if (token === expected || headerKey === expected) {
      return true;
    }
    throw new UnauthorizedException('Invalid API key');
  }
}
