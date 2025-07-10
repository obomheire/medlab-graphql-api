import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateEntity } from '../entity/template.entity';
import {
  CreateTemplateCategoryRes,
  CreateTemplateRes,
  GetShortCasesRecordRes,
  GetShortCasesTemplateRes,
  GetTemplateCaseRecordsRes,
  GetTemplateCategoryCasesRes,
} from '../types/clinicalExams.types';
import { FileUpload } from 'graphql-upload-ts';
import {
  AddShortCaseTemplateInput,
  AddTemplateCaseInput,
  CreateTemplateCategoryInput,
} from '../dto/template.dto';
import ShortUniqueId from 'short-unique-id';
import { TemplateCaseType } from '../enum/clinicalExam.enum';
import * as pdf2html from 'pdf2html';
import path, { extname, join } from 'path';
import { createWriteStream } from 'fs';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { convertDocxToHtml } from 'src/utilities/service/convertToMarkDown';

@Injectable()
export class TemplateService {
  private uuuid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(TemplateEntity.name)
    private readonly templateModel: Model<TemplateEntity>,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async createTemplate(
    name: string,
    isFree = false,
  ): Promise<CreateTemplateRes> {
    try {
      const template = await this.templateModel.create({
        category: name,
        isFree,
      });
      return {
        category: template.category,
        templateUUID: template.templateUUID,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Add Template Category. This creates the category name, image and icons
  async addTemplateCategory(
    payload: CreateTemplateCategoryInput[],
    category: string,
    isFree = false,
  ): Promise<CreateTemplateCategoryRes[]> {
    try {
      const foundTemplate = await this.templateModel.findOne({
        category,
        isFree,
      });

      if (!foundTemplate) {
        throw new NotFoundException('Template not found!');
      }

      if (foundTemplate.templates.length > 0) {
        // Filter out duplicates properly
        const newPayload = payload
          .filter((cat) => {
            return !foundTemplate.templates.some(
              (item) => item.name === cat.name,
            );
          })
          .map((cat) => {
            return {
              ...cat,
              categoryUUID: this.uuuid.randomUUID(),
              shortCases: [],
              longCases: [],
            };
          });

        if (newPayload.length === 0) {
          throw new BadRequestException(
            'Template with same Category already exists!',
          );
        }

        foundTemplate.templates.push(...newPayload);
      } else {
        const newPayload = payload.map((cat) => ({
          ...cat,
          categoryUUID: this.uuuid.randomUUID(),
          shortCases: [],
          longCases: [],
        }));

        foundTemplate.templates = newPayload;
      }

      foundTemplate.markModified('templates');
      await foundTemplate.save();

      return foundTemplate.templates;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async addLongTemplateCase(
    payload: AddTemplateCaseInput,
    files: FileUpload[],
    isFree = false,
  ): Promise<TemplateEntity> {
    try {
      const { category, templateName } = payload;
      const foundTemplate = await this.templateModel.findOne({
        category,
        isFree,
      });

      if (!foundTemplate) {
        throw new NotFoundException('Template not found!');
      }

      const foundCategory = foundTemplate.templates.find(
        (template) => template.name === templateName,
      );

      if (!foundCategory) {
        throw new NotFoundException('Category not found!');
      }

      await Promise.all(
        files.map(async (_file) => {
          const file = await _file; // Await the promise to get the file object
          const fileExtension = extname(file.filename).toLowerCase(); // Get file extension

          const { createReadStream, mimetype } = file;
          const stream = createReadStream();

          const { secure_url } = await this.awsS3Service.uploadFile(
            'clinical-exams-template-files',
            stream,
            fileExtension,
            mimetype,
          ); // Upload file to S3

          // Return result for each file
          const fileName = file?.filename?.split('.')[0];
          foundCategory.longCases.push({
            caseUUID: this.uuuid.randomUUID(),
            name: fileName,
            content: secure_url,
          });
        }),
      );

      foundTemplate.markModified('templates');
      await foundTemplate.save();

      return foundTemplate;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  // This is for testing purposes
  async addLongTemplateCaseTest(
    payload: AddTemplateCaseInput,
    files: FileUpload[],
  ): Promise<TemplateEntity> {
    try {
      const { category, templateName } = payload;
      const foundTemplate = await this.templateModel.findOne({ category });

      if (!foundTemplate) {
        throw new NotFoundException('Template not found!');
      }

      const foundCategory = foundTemplate.templates.find(
        (template) => template.name === templateName,
      );

      if (!foundCategory) {
        throw new NotFoundException('Category not found!');
      }

      for (const file of files) {
        const fs = await file;
        const markdown = await convertDocxToHtml(fs);
        const fileName = fs?.filename?.split('.')[0];
        foundCategory.longCases.push({
          caseUUID: this.uuuid.randomUUID(),
          name: fileName,
          content: markdown,
        });
      }

      foundTemplate.markModified('templates');
      await foundTemplate.save();

      return foundTemplate;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async addShortTemplateCase(
    payload: AddShortCaseTemplateInput,
    files: FileUpload[],
    isFree = false,
  ): Promise<TemplateEntity> {
    try {
      const { category, templateName, title } = payload;
      const foundTemplate = await this.templateModel.findOne({
        category,
        isFree,
      });

      if (!foundTemplate) {
        throw new NotFoundException('Template not found!');
      }

      const foundCategory = foundTemplate.templates.find(
        (template) => template.name === templateName,
      );

      if (!foundCategory) {
        throw new NotFoundException('Category not found!');
      }

      await Promise.all(
        files.map(async (_file) => {
          const file = await _file; // Await the promise to get the file object
          const fileExtension = extname(file.filename).toLowerCase(); // Get file extension

          const { createReadStream, mimetype } = file;
          const stream = createReadStream();

          const { secure_url } = await this.awsS3Service.uploadFile(
            'clinical-exams-template-files',
            stream,
            fileExtension,
            mimetype,
          ); // Upload file to S3

          // Return result for each file
          const fileName = file?.filename?.split('.')[0];

          //Checks if the sub folder exist on the category
          const foundSubCase = foundCategory.shortCases.find(
            (caseItem) => caseItem.title.toLowerCase() === title.toLowerCase(),
          );

          if (foundSubCase) {
            foundCategory.shortCases.find((caseItem) => {
              if (caseItem?.title?.toLowerCase() === title?.toLowerCase()) {
                caseItem.cases.push({
                  caseUUID: this.uuuid.randomUUID(),
                  name: fileName,
                  content: secure_url,
                });
              }
            });
          } else {
            foundCategory.shortCases.push({
              title,
              cases: [
                {
                  caseUUID: this.uuuid.randomUUID(),
                  name: fileName,
                  content: secure_url,
                },
              ],
            });
          }
        }),
      );

      foundTemplate.markModified('templates');
      await foundTemplate.save();

      return foundTemplate;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async getTemplates(
    category: string,
    templateType: TemplateCaseType,
    templateName?: string,
    isFree = false,
  ): Promise<TemplateEntity> {
    try {
      const pipeline: any[] = [
        { $match: { category, isFree } },
        {
          $project: {
            templateUUID: 1,
            category: 1,
            templates: {
              $map: {
                input: {
                  $filter: {
                    input: '$templates',
                    as: 'template',
                    cond: templateName
                      ? { $eq: ['$$template.name', templateName] }
                      : { $literal: true },
                  },
                },
                as: 'template',
                in: {
                  $mergeObjects: [
                    {
                      categoryUUID: '$$template.categoryUUID',
                      name: '$$template.name',
                      description: '$$template.description',
                      image: '$$template.image',
                      icon: '$$template.icon',
                    },
                    templateType === 'SHORT CASE'
                      ? {
                          shortCases: {
                            $filter: {
                              input: '$$template.shortCases',
                              as: 'sc',
                              cond: {
                                $gt: [{ $size: '$$sc.cases' }, 0],
                              },
                            },
                          },
                        }
                      : {},
                    templateType === 'LONG CASE'
                      ? {
                          longCases: {
                            $cond: {
                              if: {
                                $gt: [{ $size: '$$template.longCases' }, 0],
                              },
                              then: '$$template.longCases',
                              else: [],
                            },
                          },
                        }
                      : {},
                  ],
                },
              },
            },
          },
        },
      ];

      const result = await this.templateModel.aggregate(pipeline).exec();
      const formattedResult = result[0].templates
        .filter((template) => {
          if (templateType === 'SHORT CASE') {
            return template.shortCases.length > 0;
          } else if (templateType === 'LONG CASE') {
            return template.longCases.length > 0;
          }
        })
        .map((template) => {
          const { shortCases, longCases, ...rest } = template;
          return {
            ...rest,
          };
        });

      return {
        ...result[0],
        templates: formattedResult,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async getLongCasesTemplate(
    category: string,
    templateName: string,
    isFree = false,
    page = 1,
    limit = 100,
  ): Promise<any[]> {
    try {
      const skip = (page - 1) * limit;

      const pipeline: any[] = [
        { $match: { category, isFree } },
        {
          $project: {
            templates: {
              $filter: {
                input: '$templates',
                as: 'template',
                cond: { $eq: ['$$template.name', templateName] },
              },
            },
          },
        },
        { $unwind: '$templates' },
        {
          $project: {
            longCases: '$templates.longCases',
          },
        },
        { $unwind: '$longCases' },
        { $skip: skip },
        { $limit: limit },
        {
          $replaceRoot: { newRoot: '$longCases' },
        },
      ];

      const result = await this.templateModel.aggregate(pipeline).exec();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async getShortCasesTemplate(
    category: string,
    templateName: string,
    isFree = false,
    page = 1,
    limit = 100,
  ): Promise<GetShortCasesTemplateRes[]> {
    try {
      const skip = (page - 1) * limit;
      const pipeline: any[] = [
        { $match: { category, isFree } },
        {
          $project: {
            templates: {
              $filter: {
                input: '$templates',
                as: 'template',
                cond: { $eq: ['$$template.name', templateName] },
              },
            },
          },
        },
        { $unwind: '$templates' },
        {
          $project: {
            shortCases: '$templates.shortCases',
          },
        },
        { $unwind: '$shortCases' },
        {
          $match: {
            'shortCases.cases.0': { $exists: true },
          },
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            title: '$shortCases.title',
            _id: 0,
          },
        },
      ];
      const result = await this.templateModel.aggregate(pipeline).exec();

      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async getShortCasesTemplateRecords(
    category: string,
    templateName: string,
    isFree = false,
    title: string,
    page = 1,
    limit = 10,
  ): Promise<GetShortCasesRecordRes[]> {
    try {
      const skip = (page - 1) * limit;

      const pipeline: any[] = [
        { $match: { category, isFree } },
        {
          $project: {
            templates: {
              $filter: {
                input: '$templates',
                as: 'template',
                cond: { $eq: ['$$template.name', templateName] },
              },
            },
          },
        },
        { $unwind: '$templates' },
        {
          $project: {
            cases: '$templates.shortCases',
          },
        },
        { $unwind: '$cases' },
        { $match: { 'cases.title': title } },
        { $skip: skip },
        { $limit: limit },
        {
          $replaceRoot: { newRoot: '$cases' },
        },
      ];

      const result = await this.templateModel.aggregate(pipeline).exec();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'An error occurred');
    }
  }

  async convertToHtml(file: FileUpload): Promise<any> {
    const { createReadStream, filename } = await file;
    const filePath = join(
      __dirname,
      '../../../src/clinicalExam/service/upload',
      filename,
    );

    // Save the file to disk
    await new Promise((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(filePath))
        .on('finish', resolve)
        .on('error', reject);
    });

    // Convert to HTML using pdf2html
    // return new Promise((resolve, reject) => {
    // console.log("the filePath:: ", filePath)
    const thefile = await pdf2html.html(filePath);
    console.log('the show:: ', thefile);
    // pdf2html.html(filePath, (err, html) => {
    //   console.log("the show:: ", err, html)
    //   if (err) {
    // reject(`Conversion error: ${err}`);
    // } else {
    //   console.log("the html:: ", html)
    // resolve(html);
    // }
    // });
    // });
  }
}
