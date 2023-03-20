import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './controller/app.controller';
import { AppService } from './service/app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { TokenMiddleware } from 'src/utils/middlewares/auth/token';
import { AuthModule } from 'src/auth/auth.module';
import { RoleModule } from 'src/role/role.module';
import { PatientModule } from 'src/patient/patient.module';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { LaborataoryModule } from 'src/laborataory/laborataory.module';
dotenv.config();

@Module({
  imports: [
    UserModule,
    MailModule,
    AuthModule,
    RoleModule,
    PatientModule,
    AppointmentModule,
    LaborataoryModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: true,
      playground: true,
      sortSchema: true,
      context: ({ req }) => ({ req }),
    }),
    TypeOrmModule.forRoot({
      keepConnectionAlive: true,
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //   return consumer.apply(TokenMiddleware).forRoutes('*');
  // }
}
