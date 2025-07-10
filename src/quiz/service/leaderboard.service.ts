import { BadRequestException, Injectable } from '@nestjs/common';
import {
  LeaderboardDocument,
  LeaderboardEntity,
} from '../../user/entity/leaderboard.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from 'src/user/service/user.service';
import { OnEvent } from '@nestjs/event-emitter';
import { RecordScoreType } from '../types/leaderboard.types';
import { LeaderBoardEventsType } from '../enum/quiz.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import { ObjectId } from 'mongodb';
import { LeaderBoardRes } from 'src/user/types/user.types';
import { CACHE_KEY } from 'src/cache/constant/constant';
import { CacheService } from 'src/cache/cache.service';
import { count } from 'console';

@Injectable()
export class LeaderBoardService {
  constructor(
    @InjectModel(LeaderboardEntity.name)
    private readonly LeaderBoardModel: Model<LeaderboardDocument>,
    private readonly userService: UserService,
    private readonly cacheService: CacheService,
  ) {}

  @OnEvent(LeaderBoardEventsType.ADD_SCORE)
  async recordScore({
    points,
    timeTaken,
    region,
    user,
    component,
    subComponent,
  }: RecordScoreType) {
    if (!user || !points) throw Error('user or points property missing');

    const userId = user?._id;

    // Check if the user has already submitted a score for this component and region
    const existingScore = await this.LeaderBoardModel.findOne({
      userId,
      component,
      subComponent,
      region,
    });

    if (existingScore) {
      // If the user has already submitted a score, update the existing score
      existingScore.points += points;
      existingScore.timeTaken = (timeTaken + existingScore.timeTaken) / 2;
      await existingScore.save();
    } else {
      // If the user has not submitted a score, create a new score
      await this.LeaderBoardModel.create({
        userId,
        points,
        timeTaken,
        component,
        subComponent,
        region,
      });
    }
  }

  async getTopTens(user: UserDocument, component: string, region: string) {
    const { userUUID } = user;

    let query = null;

    if (component && region) {
      query = {
        $and: [
          {
            $or: [
              { component: { $eq: component } },
              { subComponent: { $eq: component } },
            ],
          },
          { region: { $eq: region } },
        ],
      };
    } else if (component) {
      query = {
        $or: [
          { component: { $eq: component } },
          { subComponent: { $eq: component } },
        ],
      };
    } else {
      query = { region: { $eq: region } };
    }

    const results = await this.LeaderBoardModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'userentities',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$user', 0] }, '$$ROOT'],
          },
        },
      },

      {
        $project: {
          userUUID: '$userUUID',
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          totalPoints: { $ifNull: ['$points', 0] },
          totalTimeTaken: { $ifNull: ['$timeTaken', 0] },
          profileImage: { $ifNull: ['$profileImage', ''] },
          region: { $ifNull: ['$region', ''] },
          component: 1,
        },
      },
      {
        $group: {
          _id: '$userUUID',
          userUUID: { $first: '$userUUID' },
          name: { $first: '$name' },
          totalPoints: { $sum: '$totalPoints' },
          totalTimeTaken: { $sum: '$totalTimeTaken' },
          profileImage: { $first: '$profileImage' },
          region: { $first: '$region' },
          component: { $first: '$component' },
        },
      },
      { $sort: { totalPoints: -1, totalTimeTaken: 1 } },
      {
        $limit: 10, // Limit to the top 10 users
      },
    ]); // Using index

    const userExist = results.some((user) => user?.userUUID === userUUID); // Check if the user is in the top 10

    if (!userExist) {
      const userResult = await this.LeaderBoardModel.findOne({
        ...query,
        userId: user._id,
      });

      if (userResult) {
        const _data = {
          userUUID: user.userUUID,
          name: `${user?.firstName} ${user?.lastName}`,
          totalPoints: userResult?.points ?? 0,
          totalTimeTaken: userResult?.timeTaken ?? 0,
          profileImage: user?.profileImage,
          region: userResult?.region,
          component: userResult?.component,
        };

        results.push(_data);
      }
    }

    if (results?.length < 10) return [];

    return results;
  }

  async clearLeaderboard() {
    // await this.LeaderBoardModel.deleteMany({});
  }

  async getBoardComponents() {
    const components = await this.LeaderBoardModel.aggregate([
      {
        $group: {
          _id: '$component',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: 10 },
        },
      },
    ]);

    return components.map((component) => component?._id);
  }

  // Get general leaderboard
  async getLeaderBoard(
    user: UserDocument,
    component?: string,
    region?: string,
  ): Promise<LeaderBoardRes[]> {
    try {
      const cacheKey = `${CACHE_KEY.LEADERBOARD}:${user.userUUID}:${
        component || 'all'
      }:${region || 'all'}`;

      const cachedData = await this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData; // Return data from cache if available
      }

      let leaderboard: LeaderBoardRes[];

      await this.userService.calculateRanking(user.userUUID); // Calculate user ranking

      if (component || region) {
        leaderboard = await this.getTopTens(user, component, region);
      } else {
        leaderboard = await this.userService.topTenQuizzers(user);
      }

      await this.cacheService.set(cacheKey, leaderboard); // Set cache with no TTL

      return leaderboard;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete user's record from leaderboard
  async deleteUserRecords(userId: ObjectId) {
    try {
      const board = await this.LeaderBoardModel.deleteMany({ userId }).exec(); // add index
      return {
        count: board.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
