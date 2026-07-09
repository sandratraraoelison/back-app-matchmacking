import { User } from '@/models/User';
import { IUserProfile } from '@/types';
import { AppError } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';

export class UserService {
  async getUserProfile(userId: string): Promise<IUserProfile> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
      }

      return {
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
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Get user profile error:', error);
      throw new AppError('Erreur lors de la récupération du profil', 500);
    }
  }

  async updateUserProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      location?: string;
      interests?: string[];
      avatar?: string;
    }
  ): Promise<IUserProfile> {
    try {
      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
      }

      logger.info(`User profile updated: ${userId}`);

      return {
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
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Update user profile error:', error);
      throw new AppError('Erreur lors de la mise à jour du profil', 500);
    }
  }

  async searchUsers(query: string, limit = 20, excludeUserId?: string): Promise<IUserProfile[]> {
    try {
      const filter: any = {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
        ],
      };

      if (excludeUserId) {
        filter._id = { $ne: excludeUserId };
      }

      const users = await User.find(filter).limit(limit).select('-password');

      return users.map((user) => ({
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
      }));
    } catch (error) {
      logger.error('Search users error:', error);
      throw new AppError("Erreur lors de la recherche d'utilisateurs", 500);
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      });
    } catch (error) {
      logger.error('Update online status error:', error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const result = await User.findByIdAndDelete(userId);

      if (!result) {
        throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
      }

      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Delete user error:', error);
      throw new AppError('Erreur lors de la suppression du utilisateur', 500);
    }
  }
}

export const userService = new UserService();
