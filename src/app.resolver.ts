import { Query, Resolver } from '@nestjs/graphql';
import { AppService } from './app.service';
import { AppRes } from './app.types';

@Resolver()
export class AppResolver {
  constructor(private readonly appService: AppService) {}

  @Query(() => AppRes)
  getHello(): AppRes {
    return this.appService.getHello();
  }
}
