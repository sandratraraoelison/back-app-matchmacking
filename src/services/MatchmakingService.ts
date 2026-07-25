import { User } from '@/models/User';
import { Match } from '@/models/Match';
import { IMatch, IUserProfile } from '@/types';
import { AppError } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';

export class MatchmakingService {
  /**
   * Calculate compatibility score between two users based on common interests
   */
  private calculateCompatibility(
    interests1: string[],
    interests2: string[]
  ): { score: number; commonInterests: string[] } {
    const set1 = new Set(interests1.map((i) => i.toLowerCase()));
    const set2 = new Set(interests2.map((i) => i.toLowerCase()));

    const commonInterests = Array.from(set1).filter((i) => set2.has(i));
    const totalInterests = new Set([...set1, ...set2]).size;

    const score =
      totalInterests > 0 ? Math.round((commonInterests.length / totalInterests) * 100) : 0;

    return { score, commonInterests };
  }

  /**
   * Get potential matches for a user
   */
  async getPotentialMatches(
    userId: string,
    limit = 10
  ): Promise<(IUserProfile & { matchingScore: number })[]> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
      }

      // Get users that haven't been matched or rejected yet
      const existingMatches = await Match.find({
        $or: [{ user1Id: userId }, { user2Id: userId }],
      }).select('user1Id user2Id');

      const matchedUserIds = new Set<string>();
      existingMatches.forEach((match) => {
        matchedUserIds.add(match.user1Id.toString());
        matchedUserIds.add(match.user2Id.toString());
      });

      // Find potential matches from other users
      const potentialUsers = await User.find({
        _id: {
          $ne: userId,
          $nin: Array.from(matchedUserIds),
        },
      })
        .limit(limit)
        .lean();

      // Calculate compatibility and sort
      const matchesWithScore = potentialUsers.map((potentialUser) => {
        const { score } = this.calculateCompatibility(user.interests, potentialUser.interests);

        return {
          _id: potentialUser._id?.toString(),
          email: potentialUser.email,
          username: potentialUser.username,
          firstName: potentialUser.firstName,
          lastName: potentialUser.lastName,
          avatar: potentialUser.avatar,
          bio: potentialUser.bio,
          interests: potentialUser.interests,
          location: potentialUser.location,
          createdAt: potentialUser.createdAt,
          updatedAt: potentialUser.updatedAt,
          isOnline: potentialUser.isOnline,
          lastSeen: potentialUser.lastSeen,
          matchingScore: score,
        };
      });

      // Sort by matching score descending
      return matchesWithScore.sort((a, b) => b.matchingScore - a.matchingScore);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Get potential matches error:', error);
      throw new AppError('Erreur lors de la récupération des matchs potentiels', 500);
    }
  }

  /**
   * Create a match between two users
   */
  async createMatch(user1Id: string, user2Id: string): Promise<IMatch> {
    try {
      // Verify both users exist
      const [user1, user2] = await Promise.all([User.findById(user1Id), User.findById(user2Id)]);

      if (!user1 || !user2) {
        throw new AppError("Un des utilisateurs n'existe pas", 404, 'USER_NOT_FOUND');
      }

      // Check if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      });

      if (existingMatch) {
        throw new AppError('Match déjà existant', 409, 'MATCH_EXISTS');
      }

      // Calculate compatibility
      const { score, commonInterests } = this.calculateCompatibility(
        user1.interests,
        user2.interests
      );

      // Create match
      const match = new Match({
        user1Id,
        user2Id,
        compatibility: score,
        commonInterests,
        status: 'matched',
      });

      await match.save();

      logger.info(`Match created between ${user1Id} and ${user2Id}`);

      return {
        _id: match._id?.toString(),
        user1Id: match.user1Id.toString(),
        user2Id: match.user2Id.toString(),
        compatibility: match.compatibility,
        commonInterests: match.commonInterests,
        matchedAt: match.matchedAt,
        status: match.status,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Create match error:', error);
      throw new AppError('Erreur lors de la création du match', 500);
    }
  }

  /**
   * Reject a potential match
   */
  async rejectMatch(user1Id: string, user2Id: string): Promise<IMatch> {
    try {
      let match = await Match.findOne({
        $or: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      });

      if (!match) {
        // Create a rejected match record
        match = new Match({
          user1Id,
          user2Id,
          compatibility: 0,
          commonInterests: [],
          status: 'rejected',
        });
      } else {
        match.status = 'rejected';
      }

      await match.save();

      logger.info(`Match rejected between ${user1Id} and ${user2Id}`);

      return {
        _id: match._id?.toString(),
        user1Id: match.user1Id.toString(),
        user2Id: match.user2Id.toString(),
        compatibility: match.compatibility,
        commonInterests: match.commonInterests,
        matchedAt: match.matchedAt,
        status: match.status,
      };
    } catch (error) {
      logger.error('Reject match error:', error);
      throw new AppError('Erreur lors du rejet du match', 500);
    }
  }

  /**
   * Get all matches for a user
   */
  async getUserMatches(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<(IMatch & { targetUser?: IUserProfile })[]> {
    try {
      const skip = (page - 1) * limit;

      const matches = await Match.find({
        $or: [{ user1Id: userId }, { user2Id: userId }],
        status: 'matched',
      })
        .skip(skip)
        .limit(limit)
        .lean();

      const otherUserIds = matches.map((match) =>
        match.user1Id.toString() === userId ? match.user2Id.toString() : match.user1Id.toString()
      );
      const users = await User.find({ _id: { $in: otherUserIds } }).lean();
      const usersById = new Map(users.map((user) => [user._id.toString(), user]));

      return matches.map((match) => {
        const otherUserId = match.user1Id.toString() === userId ? match.user2Id.toString() : match.user1Id.toString();
        const targetUser = usersById.get(otherUserId);

        return {
        _id: match._id?.toString(),
        user1Id: match.user1Id.toString(),
        user2Id: match.user2Id.toString(),
        compatibility: match.compatibility,
        commonInterests: match.commonInterests,
        matchedAt: match.matchedAt,
        status: match.status,
        targetUser: targetUser
          ? {
              _id: targetUser._id.toString(),
              email: targetUser.email,
              username: targetUser.username,
              firstName: targetUser.firstName,
              lastName: targetUser.lastName,
              avatar: targetUser.avatar,
              bio: targetUser.bio,
              interests: targetUser.interests,
              location: targetUser.location,
              createdAt: targetUser.createdAt,
              updatedAt: targetUser.updatedAt,
              isOnline: targetUser.isOnline,
              lastSeen: targetUser.lastSeen,
            }
          : undefined,
        };
      });
    } catch (error) {
      logger.error('Get user matches error:', error);
      throw new AppError('Erreur lors de la récupération des matchs', 500);
    }
  }
}

export const matchmakingService = new MatchmakingService();
