import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '@/config/environment';
import { IAuthPayload } from '@/types';

export class JwtService {
  static generateAccessToken(payload: IAuthPayload): string {
    return jwt.sign(
      payload,
      config.jwtSecret as Secret,
      {
        expiresIn: config.jwtExpire,
        algorithm: 'HS256',
      } as SignOptions
    );
  }

  static generateRefreshToken(payload: IAuthPayload): string {
    return jwt.sign(
      payload,
      config.refreshTokenSecret as Secret,
      {
        expiresIn: config.refreshTokenExpire,
        algorithm: 'HS256',
      } as SignOptions
    );
  }

  static verifyAccessToken(token: string): IAuthPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret as Secret);
      return decoded as IAuthPayload;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): IAuthPayload | null {
    try {
      const decoded = jwt.verify(token, config.refreshTokenSecret as Secret);
      return decoded as IAuthPayload;
    } catch (error) {
      return null;
    }
  }

  static decodeToken(token: string): unknown {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}
