// import { Injectable, BadRequestException, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Cron } from '@nestjs/schedule';
// import { PractCaseCatEntity } from 'src/clinicalExam/entity/practCaseCat.entity';

// @Injectable()
// export class UpdatePatientProfileService {
//   private readonly logger = new Logger(UpdatePatientProfileService.name);

//   constructor(
//     @InjectModel(PractCaseCatEntity.name)
//     private readonly practCaseCatModel: Model<PractCaseCatEntity>,
//   ) {
//     this.logger.log('UpdatePatientProfileService instantiated');
//   }

//   // Shedule a cron task that will run and send email to all users
//   @Cron('22 17 * * *') // run the cron @ 01:46 pm
//   async updatePatientProfile() {
//     this.logger.log('Cron job started');
//     try {
//       const BATCH_SIZE = 15; // Define the batch size
//       const INTERVAL_MS = 1 * 60 * 1000; // 5 minutes interval in milliseconds
//       let offset = 0;
//       let totalUpdated = 0;

//       while (true) {
//         const practCaseCats = await this.practCaseCatModel
//           .find({})
//           .skip(offset)
//           .limit(BATCH_SIZE)
//           .exec();

//         if (practCaseCats.length === 0) {
//           this.logger.log(
//             `Successfully updated ${totalUpdated} practice case categories`,
//           );

//           this.logger.log('Cron job completed successfully');

//           return;
//         }

//         const bulkOps = practCaseCats
//           .map((practCaseCat) => {
//             const { dob, age } = practCaseCat.patientProfile || {};
//             if (!dob) return null; // Skip if no DOB

//             const newAge = this.calculateAge(dob);
//             if (age === newAge) return null; // Skip if age is already correct

//             return {
//               updateOne: {
//                 filter: { _id: practCaseCat._id },
//                 update: { $set: { 'patientProfile.age': newAge } },
//               },
//             };
//           })
//           .filter(Boolean); // Remove null values

//         // Update the patient profiles
//         if (bulkOps.length > 0) {
//           await this.practCaseCatModel.bulkWrite(bulkOps);
//           totalUpdated += bulkOps.length;
//           this.logger.log(`Updated ${bulkOps.length} patient profiles`);
//         }

//         offset += BATCH_SIZE; // Move to the next batch

//         // Wait for the specified interval before fetching the next batch
//         await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
//       }
//     } catch (error) {
//       throw new BadRequestException(error.message);
//     }
//   }

//   // Calculate age from date of birth
//   private calculateAge(dob: string) {
//     try {
//       const [day, monthStr, year] = dob.split('-');
//       const birthDate = new Date(`${monthStr} ${day}, ${year}`);

//       const today = new Date();
//       const age = today.getFullYear() - birthDate.getFullYear();

//       return today <
//         new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
//         ? age - 1
//         : age;
//     } catch (error) {
//       throw new BadRequestException(error.message);
//     }
//   }
// }

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { PractCaseCatEntity } from 'src/clinicalExam/entity/practCaseCat.entity';

@Injectable()
export class UpdatePatientProfileService {
  private readonly logger = new Logger(UpdatePatientProfileService.name);

  constructor(
    @InjectModel(PractCaseCatEntity.name)
    private readonly practCaseCatModel: Model<PractCaseCatEntity>,
  ) {
    this.logger.log('UpdatePatientProfileService instantiated');
  }

  // Shedule a cron task that will run and send email to all users
  // @Cron('46 17 * * *') // run the cron @ 01:46 pm
  @Cron('0 17 1 * *') // Runs at 5PM on the 1st of every month
  async updatePatientProfile() {
    this.logger.log('Cron job started');
    try {
      const BATCH_SIZE = 25; // Define the batch size
      const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes interval in milliseconds
      let offset = 0;
      let totalUpdated = 0;

      while (true) {
        const practCaseCats = await this.practCaseCatModel
          .find({})
          .skip(offset)
          .limit(BATCH_SIZE)
          .exec();

        if (practCaseCats.length === 0) {
          this.logger.log(
            `Successfully updated ${totalUpdated} practice case categories`,
          );

          this.logger.log('Cron job completed successfully');

          return;
        }

        const bulkOps = practCaseCats
          .map((practCaseCat) => {
            const { dob, age } = practCaseCat.patientProfile || {};
            let { patientOverview } = practCaseCat;

            if (!dob) return null;

            const newAge = this.calculateAge(dob);

            const agePattern = /(\b\d{1,3})\s+year\s+old\b/;
            const match = patientOverview?.match(agePattern);

            const overviewNeedsUpdate = match && match[1] !== String(newAge);
            const ageNeedsUpdate = age !== newAge;

            // If neither needs update, skip
            if (!overviewNeedsUpdate && !ageNeedsUpdate) return null;

            const updates: any = {};

            if (ageNeedsUpdate) {
              updates['patientProfile.age'] = newAge;
            }

            if (overviewNeedsUpdate) {
              patientOverview = patientOverview.replace(
                agePattern,
                `${newAge} year old`,
              );
              updates['patientOverview'] = patientOverview;
            }

            return {
              updateOne: {
                filter: { _id: practCaseCat._id },
                update: { $set: updates },
              },
            };
          })
          .filter(Boolean);

        // Update the patient profiles
        if (bulkOps.length > 0) {
          await this.practCaseCatModel.bulkWrite(bulkOps);
          totalUpdated += bulkOps.length;
          this.logger.log(`Updated ${bulkOps.length} patient profiles`);
        }

        offset += BATCH_SIZE; // Move to the next batch

        // Wait for the specified interval before fetching the next batch
        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Calculate age from date of birth
  private calculateAge(dob: string) {
    try {
      const [day, monthStr, year] = dob.split('-');
      const birthDate = new Date(`${monthStr} ${day}, ${year}`);

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      return today <
        new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        ? age - 1
        : age;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
