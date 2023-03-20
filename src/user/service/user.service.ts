import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generateIncrementalValue } from 'src/utils/functions/generateValue';
import { MailService } from 'src/mail/mail.service';
import { sendWelcomeEmail } from 'src/templates/email.template';
import { FilterDto } from 'src/utils/dtos/filter.dto';
import { UserResponse } from '../dto/response.dto';
import { AccountStatusEnum } from '../enum/accountStatus.enum';
import { AuthService } from 'src/auth/service/auth.service';

// export interface UserResponse {
//   users: User[];
//   count: number;
//   currentPage: number;
//   etotalPages: number;
// }
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private mailService: MailService,
    // private readonly authService: AuthService,
  ) {}

  create = async (createUserInput: CreateUserInput): Promise<User> => {
    try {
      this.logger.log(`create new user`);
      const staffExists = await this.userRepository.findOne({
        where: { email: createUserInput.email },
      });

      if (staffExists) {
        throw new BadRequestException('User already exists');
      }
      const serialNumber = await generateIncrementalValue(this.userRepository);
      const unique = `ID-${serialNumber}`;

      //generate random 12 alphanumeric password
      const pass = Math.random().toString(36).slice(-12);

      const user = this.userRepository.create({
        ...createUserInput,
        unique,
        password: await bcrypt.hash(pass, 10),
      });
      const savedUser = await this.userRepository.save(user);
      const fullName = `${savedUser.firstName} ${savedUser.lastName}`;
      // send mail
      const htmlTemplate = sendWelcomeEmail(
        fullName,
        savedUser.email,
        unique,
        pass,
      );
      const text = `Hello ${savedUser.firstName} ${savedUser.lastName}, welcome to our organization. Your staff ID is ${unique} and your password is ${pass}. Please change your password and log in.`;

      this.mailService.sendMail(
        text,
        htmlTemplate,
        savedUser.email,
        'Welcome to the team!',
      );
      // this.mailService.sendMail(htmlTemplate, savedUser.email, 'Welcome to the team')

      // return savedUser;
      //we want to return the user without the password and also the relation role 
      const { password, ...result } = savedUser;
      return savedUser;
    } catch (error) {
      this.logger.error(`create:user:error:${error.message}`);
      throw error;
    }
  };

  findAll = async (filterDto: FilterDto): Promise<UserResponse> => {
    try {
      this.logger.log(`findAll:user`);
      let { page, limit, search, startDate, endDate } = filterDto;
      const skip = (page - 1) * limit;

      
      //populate the relations of the user
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        // .where('user.accountStatus = :accountStatus', { accountStatus: AccountStatusEnum.ACTIVE })
        .orderBy('user.createdAt', 'DESC');

      if (search || startDate) {
        let whereConditions = [];
        let whereParams: any = {};
      
        if (search) {
          whereConditions.push(
            'user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR user.unique LIKE :search'
          );
          whereParams.search = `%${search}%`;
        }
      
        let end: any;
        if (startDate) {
          if (endDate === undefined) {
            end = new Date(startDate)
              .toISOString()
              .replace(/T.*/, 'T23:59:59.999Z');
          }
          

          if (filterDto.endDate) {
            end = new Date(filterDto.endDate)
            .toISOString()
              .replace(/T.*/, 'T23:59:59.999Z');
          }

          //if endDate is less than startDate, throw error
          if (end < startDate) {
            throw new BadRequestException(
              'End date cannot be less than start date',
            );
          }
      
          whereConditions.push('user.createdAt BETWEEN :startDate AND :end');
          whereParams.startDate = startDate;
          whereParams.end = end;
        }
      
        query.andWhere(whereConditions.join(' AND '), whereParams);
      }

      const [users, count] = await query
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(count / limit);

      return { users, count, currentPage: page, totalPages };
    } catch (error) {
      this.logger.error(`findAll:user:error:${error.message}`);
      throw error;
    }
  };

  findOne = async (id: string): Promise<User> => {
    try {
      this.logger.log(`findOne:user`);
      const user = await this.userRepository.findOneOrFail({ where: { id }, relations: ['role'] });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`findOne:user:error:${error.message}`);
      throw error;
    }
  };

  //update refresh token in user entity
  updateRefreshToken = async (id: string, refreshToken: string) => {
    try {
      this.logger.log(`updateRefreshToken:user`);
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      console.log(user);
      if (!user) {
        throw new NotFoundException('User not found');
      } else {
        user.refreshToken = refreshToken;
        await this.userRepository.save(user);
      }
    } catch (error) {
      this.logger.error(`updateRefreshToken:user:error:${error.message}`);
      throw error;
    }
  }

  //find by email
  findByEmail = async (email: string): Promise<User> => {
    try {
      this.logger.log(`findByEmail:user`);
      const user = await this.userRepository.findOne({ where: { email }, relations: ['role'] });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`findByEmail:user:error:${error.message}`);
      throw error;
    }
  }

  //find by id
  findById = async (id: string): Promise<User> => {
    try {
      this.logger.log(`findById:user`);
      const user = await this.userRepository.findOne({ where: { id }, relations: ['role'] });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`findById:user:error:${error.message}`);
      throw error;
    }
  }

  //update password
  updatePassword = async (id: string, password: string) => {
    try {
      this.logger.log(`update
      Password:user`);
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      const newUser = await this.userRepository.save(user);
      return newUser;
    } catch (error) {
      this.logger.error(`updatePassword:user:error:${error.message}`);
      throw error;
    }
  }

  //

  //suspend user
  suspendUser = async (id: string) => {
    try {
      this.logger.log(`suspendUser:user`);
      const user = await this.userRepository.findOneOrFail({ where: { id }, relations: ['role'] });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.accountStatus = AccountStatusEnum.SUSPENDED;
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`suspendUser:user:error:${error.message}`);
      throw error;
    }
  }

  //activate user
  activateUser = async (id: string) => {
    try {
      this.logger.log(`activateUser:user`);
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.accountStatus = AccountStatusEnum.ACTIVE;
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`activateUser:user:error:${error.message}`);
      throw error;
    }
  }

  //delete user permanently
  remove = async (id: string): Promise<string> => {
    try {
      this.logger.log(`deleteUserPermanently:user`);
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.userRepository.delete(id);
      return 'User deleted successfully';
    } catch (error) {
      this.logger.error(`deleteUserPermanently:user:error:${error.message}`);
      throw error;
    }
  }

  //find by either or both email and unique
  findByEmailOrUnique = async (email: string, unique: string): Promise<User> => {
    try {
      this.logger.log(`findByEmailOrUnique:user`);
      const user = await this.userRepository.findOne({
        where: [{ email }, { unique }], 
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`findByEmailOrUnique:user:error:${error.message}`);
      throw error;
    }
  }

  //update user
  update = async (id: string, data: UpdateUserInput): Promise<User> => {
    try {
      this.logger.log(`update:user`);
      // const id = data.id
      const user = await this.userRepository.findOneOrFail({ where: { id } });
      const previousEmail = user.email;
      console.log(previousEmail, 'previous email')
      if (!user) {
        throw new NotFoundException('User not found');
      }
      //if user is updating their email, log the account out by turning the status to inactive and send them a new email

      //generate 1 12 random alphanumeric characters with special characters
      const updatedUser = Object.assign(user, data);
      const pass = Math.random().toString(36).slice(-12);
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(updatedUser.email, previousEmail, 'updated email and previous emai')
      console.log(updatedUser.email !== previousEmail, 'updated email and previous emai')
      if(updatedUser.email !== previousEmail){
        // this.authService.logout(user.id);
        
        const htmlTemplate = sendWelcomeEmail(
          fullName,
          updatedUser.email,
          updatedUser.unique,
          pass,
        );
        const text = `Hello ${fullName}, welcome to our organization. Your staff ID is ${user.unique} and your password is ${pass}. Please change your password and log in.`;
  
        this.mailService.sendMail(
          text,
          htmlTemplate,
          updatedUser.email,
          'Email Change!',
        );
        updatedUser.accountStatus = AccountStatusEnum.INACTIVE;
        const hashedPassword = await bcrypt.hash(pass, 10);
        updatedUser.password = hashedPassword;
        const newUser = await this.userRepository.save(updatedUser);
        return newUser;
      }
  
      const newUser = await this.userRepository.save(updatedUser);
      return newUser;

    } catch (error) {
      this.logger.error(`update:user:error:${error.message}`);
      throw error;
    }
  }
}
