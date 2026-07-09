import { User } from '@/models/User';
import { JwtService } from '@/utils/jwt';
import { IAuthResponse, IUserProfile } from '@/types';
import { AppError } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';

export class AuthService {
  async register(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    interests: string[] = []
  ): Promise<IAuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        throw new AppError('Email ou username déjà utilisé', 409, 'USER_EXISTS');
      }

      // Create new user
      const user = new User({
        email,
        username,
        password,
        firstName,
        lastName,
        interests,
      });

      await user.save();

      logger.info(`User registered: ${email}`);

      // Generate tokens
      const accessToken = JwtService.generateAccessToken({
        userId: user._id!.toString(),
        email: user.email,
        username: user.username,
      });

      const refreshToken = JwtService.generateRefreshToken({
        userId: user._id!.toString(),
        email: user.email,
        username: user.username,
      });

      const userProfile: IUserProfile = {
        _id: user._id?.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };

      return {
        accessToken,
        refreshToken,
        user: userProfile,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Register error:', error);
      throw new AppError("Erreur lors de l'inscription", 500);
    }
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    try {
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new AppError('Email ou password incorrect', 401, 'INVALID_CREDENTIALS');
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new AppError('Email ou password incorrect', 401, 'INVALID_CREDENTIALS');
      }

      logger.info(`User logged in: ${email}`);

      // Generate tokens
      const accessToken = JwtService.generateAccessToken({
        userId: user._id!.toString(),
        email: user.email,
        username: user.username,
      });

      const refreshToken = JwtService.generateRefreshToken({
        userId: user._id!.toString(),
        email: user.email,
        username: user.username,
      });

      const userProfile: IUserProfile = {
        _id: user._id?.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };

      return {
        accessToken,
        refreshToken,
        user: userProfile,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Login error:', error);
      throw new AppError('Erreur lors de la connexion', 500);
    }
  }

  async refreshToken(refreshToken: string): Promise<IAuthResponse> {
    try {
      const decoded = JwtService.verifyRefreshToken(refreshToken);

      if (!decoded) {
        throw new AppError('Token expiré', 401, 'EXPIRED_TOKEN');
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
      }

      const accessToken = JwtService.generateAccessToken({
        userId: user._id!.toString(),
        email: user.email,
        username: user.username,
      });

      const newRefreshToken = JwtService.generateRefreshToken({
        userId: user._id!.toString(),
        email: user.email,
        username: user.username,
      });

      const userProfile: IUserProfile = {
        _id: user._id?.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: userProfile,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Refresh token error:', error);
      throw new AppError('Erreur lors du renouvellement du token', 500);
    }
  }
}

export const authService = new AuthService();
